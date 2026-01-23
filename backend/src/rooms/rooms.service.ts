import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async getAllRooms() {
    return await this.roomModel.find().lean();
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

  async handleConnection(client: any, ...args: any[]) {
    try {
      const user = await this.jwtService.verify(client.handshake.auth.token, {
        secret: process.env.JWT_SECRET,
      });

      this.inMemoryStore.userIds.set(client.id, user._id);
    } catch (err) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      this.inMemoryStore.userIds.delete(client.id);

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

      const userId = this.inMemoryStore.userIds.get(client.id);

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

      client.emit('room:joined', Y.encodeStateAsUpdate(ydoc), roomDetails.lang);
    } catch (err) {
      console.error('Join error:', err);
      client.emit('room:error', 'Failed to Join Room');
    }
  }

  async leaveRoom(client: Socket, roomId: string) {
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
