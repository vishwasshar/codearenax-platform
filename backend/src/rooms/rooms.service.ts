import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Room } from 'src/schemas/room.schema';
import { CreateRoom } from './dtos/CreateRoom.dto';
import { UpdateRoom } from './dtos/UpdateRoom.dto';
import { AccessRole } from 'src/common/enums/access-role.enum';
import { MemoryStoreService } from 'src/memory-store/memory-store.service';
import { stringToYDoc } from 'src/utils/stringToYDoc';
import { ydocToString } from 'src/utils/ydocToString';
import { Socket } from 'socket.io';
import * as Y from 'yjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
    private inMemoryStore: MemoryStoreService,
    private jwtService: JwtService,
  ) {}

  async authorizeUser(roomId: string, userId: string) {
    const room = await this.roomModel
      .findById(roomId)
      .select('accessList')
      .lean();

    if (!room) throw new NotFoundException('Room Not Found');

    return room?.accessList.find((usr: any) => usr.user == userId)?.role;
  }

  async getAllRooms(userId: string) {
    const rooms = await this.roomModel.aggregate([
      { $match: { 'accessList.user': new Types.ObjectId(userId) } },
      {
        $addFields: {
          myrole: {
            $first: {
              $filter: {
                input: '$accessList',
                as: 'a',
                cond: { $eq: ['$$a.user', new Types.ObjectId(userId)] },
              },
            },
          },
        },
      },
      {
        $project: {
          slug: 1,
          name: 1,
          lang: 1,
          role: '$myrole.role',
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    return rooms;
  }

  async getRoomById(id: string) {
    return await this.roomModel
      .findById(id)
      .populate('accessList.user', 'name email')
      .lean();
  }

  async getRoomBySlug(slug: string) {
    return await this.roomModel
      .findOne({ slug })
      .populate('accessList.user', 'name email')
      .lean();
  }

  async createNewRoom(createRoom: CreateRoom, userId: string) {
    const newRoom = new this.roomModel({
      ...createRoom,
      accessList: { user: userId, role: AccessRole.OWNER },
    });

    await newRoom.save();

    return newRoom;
  }

  async saveCodeSnapshot(id: string) {
    const ydoc = this.inMemoryStore.crdtRooms.get(id);
    const updatedContent = ydocToString(ydoc);

    return await this.roomModel.findByIdAndUpdate(
      id,
      { content: updatedContent },
      {
        new: true,
      },
    );
  }

  async updateRoom(id: string, updateRoom: UpdateRoom) {
    return await this.roomModel.findByIdAndUpdate(id, updateRoom, {
      new: true,
    });
  }

  async deleteRoom(roomId: string) {
    await this.roomModel.findByIdAndDelete(roomId);

    this.inMemoryStore.activeRooms.delete(roomId);
    this.inMemoryStore.crdtRooms.delete(roomId);

    return true;
  }

  async addUserAccess(roomId: string, userId: string, role: AccessRole) {
    const newAccess = { _id: new Types.ObjectId(), user: userId, role };

    await this.roomModel.findOneAndUpdate(
      { _id: roomId, 'accessList.user': { $ne: new Types.ObjectId(userId) } },
      {
        $addToSet: { accessList: newAccess },
      },
      { new: true },
    );

    const populated = await this.roomModel
      .findOne(
        { _id: roomId, 'accessList._id': newAccess._id },
        { 'accessList.$': 1 },
      )
      .populate('accessList.user', 'name email');

    return populated?.accessList[0];
  }

  async updateUserAccess(roomId: string, userId: string, newRole: AccessRole) {
    const updatedRoom = await this.roomModel.updateOne(
      { _id: roomId, 'accessList.user': userId },
      {
        $set: {
          'accessList.$.role': newRole,
        },
      },
      { new: true },
    );

    return updatedRoom;
  }

  async removeUserAccess(roomId: string, userId: string) {
    const updatedRoom = await this.roomModel.findByIdAndUpdate(
      roomId,
      {
        $pull: { accessList: { user: userId } },
      },
      { new: true },
    );

    return updatedRoom;
  }

  async handleConnection(client: any, ...args: any[]) {
    try {
      const user = await this.jwtService.verify(client.handshake.auth.token, {
        secret: process.env.JWT_SECRET,
      });

      client.data.userId = user._id;
      client.data.name = user.name;
    } catch (err) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      for (const [
        roomId,
        roomDetails,
      ] of this.inMemoryStore.activeRooms.entries()) {
        if (!roomDetails.activeUsers.includes(client.id)) continue;

        roomDetails.activeUsers = roomDetails.activeUsers.filter(
          (id: string) => id !== client.id,
        );

        if (roomDetails?.activeUsers?.length === 0) {
          await this.saveCodeSnapshot(roomId);

          this.inMemoryStore.activeRooms.delete(roomId);
          this.inMemoryStore.crdtRooms.delete(roomId);
        } else {
          this.inMemoryStore.activeRooms.set(roomId, roomDetails);
        }
      }
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  }

  async handleRoomJoin(client: Socket, roomId: string) {
    try {
      let slug: string = '';
      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        slug = roomId;
        roomId = this.inMemoryStore.roomSlug.get(slug) || '';
      }

      let roomDetails = this.inMemoryStore.activeRooms.get(roomId);
      let ydoc: Y.Doc;

      if (!roomDetails) {
        if (roomId) roomDetails = await this.getRoomById(roomId);
        else {
          roomDetails = await this.getRoomBySlug(slug);
        }
        if (!roomDetails) {
          client.emit('room:error', 'Room not found');
          return;
        }
        roomId = roomDetails._id.toString();

        this.inMemoryStore.roomSlug.set(roomDetails?.slug, roomId);

        if (!roomDetails) {
          client.emit('room:error', 'Room not Found');
          throw new Error('Room not found');
        }

        roomDetails.activeUsers = [];
        roomDetails.isDirty = false;

        ydoc = stringToYDoc(roomDetails.content);
        this.inMemoryStore.crdtRooms.set(roomId, ydoc);
        this.inMemoryStore.activeRooms.set(roomId, roomDetails);
      } else {
        if (!roomId) {
          roomId = this.inMemoryStore.roomSlug.get(slug)!;
        }
        ydoc = this.inMemoryStore.crdtRooms.get(roomId)!;
      }

      const userId = client.data.userId;

      const hasAccess = roomDetails.accessList?.find(
        (u: any) => u?.user?._id?.toString() === userId?.toString(),
      );

      if (!hasAccess) {
        client.emit('room:error', 'Not Accessible');
        return;
      }

      if (!roomDetails.activeUsers.includes(client.id)) {
        roomDetails.activeUsers.push(client.id);
      }

      client.join(roomId);

      client.data.roomId = roomId;

      client.emit(
        'crdt:doc',
        Y.encodeStateAsUpdate(ydoc),
        roomDetails.lang,
        roomId,
        hasAccess.role,
      );
    } catch (err) {
      console.error('Join error:', err);
      client.emit('room:error', 'Failed to Join Room');
    }
  }

  async leaveRoom(client: Socket) {
    const roomId = client.data.roomId;

    let roomDetails = this.inMemoryStore.activeRooms.get(roomId);

    if (!roomDetails) return;

    roomDetails.activeUsers = roomDetails.activeUsers.filter(
      (socketId: string) => socketId != client.id,
    );

    if (roomDetails?.activeUsers?.length == 0) {
      await this.saveCodeSnapshot(roomId);
      this.inMemoryStore.activeRooms.delete(roomId);
      this.inMemoryStore.crdtRooms.delete(roomId);
    } else {
      this.inMemoryStore.activeRooms.set(roomId, roomDetails);
    }
  }
}
