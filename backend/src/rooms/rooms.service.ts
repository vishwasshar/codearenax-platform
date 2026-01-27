import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
    return await this.roomModel.findById(id).lean();
  }

  async createNewRoom(createRoom: CreateRoom, userId: string) {
    const newRoom = await this.roomModel.create({
      ...createRoom,
      accessList: { user: userId, role: AccessRole.OWNER },
    });

    return newRoom;
  }

  async saveCodeSnapshot(id: string, updatedContent: string) {
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

    return { roomId };
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
          const ydoc = this.inMemoryStore.crdtRooms.get(roomId);

          if (ydoc) {
            await this.saveCodeSnapshot(roomId, ydocToString(ydoc));
          }

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
      let roomDetails = this.inMemoryStore.activeRooms.get(roomId);
      let ydoc: Y.Doc;

      if (!roomDetails) {
        roomDetails = await this.getRoomById(roomId);

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
        ydoc = this.inMemoryStore.crdtRooms.get(roomId)!;
      }

      const userId = client.data.userId;

      const hasAccess = roomDetails.accessList?.some(
        (u: any) => u?.user?.toString() === userId?.toString(),
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

      client.emit('crdt:doc', Y.encodeStateAsUpdate(ydoc), roomDetails.lang);
    } catch (err) {
      console.error('Join error:', err);
      client.emit('room:error', 'Failed to Join Room');
    }
  }

  async leaveRoom(client: Socket) {
    const roomId = client.data.roomId;

    let roomDetails = this.inMemoryStore.activeRooms.get(roomId);
    let room = this.inMemoryStore.crdtRooms.get(roomId);

    if (!roomDetails) return;

    roomDetails.activeUsers = roomDetails.activeUsers.filter(
      (socketId: string) => socketId != client.id,
    );

    if (roomDetails?.activeUsers?.length == 0) {
      await this.saveCodeSnapshot(roomId, ydocToString(room));
      this.inMemoryStore.activeRooms.delete(roomId);
      this.inMemoryStore.crdtRooms.delete(roomId);
    } else {
      this.inMemoryStore.activeRooms.set(roomId, roomDetails);
    }
  }
}
