import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Room } from 'src/schemas/room.schema';
import { CreateRoom } from './dtos/CreateRoom.dto';
import { UpdateRoom } from './dtos/UpdateRoom.dto';
import { AccessRole } from 'src/common/enums/access-role.enum';
import { MemoryStoreService } from 'src/memory-store/memory-store.service';
import { stringToYDoc } from 'src/utils/stringToYDoc';
import { ydocToFiles } from 'src/utils/ydocToString';
import { ydocToWhiteboardData, populateYdocWhiteboard } from 'src/utils/whiteboardUtils';
import { Socket } from 'socket.io';
import * as Y from 'yjs';
import { JwtService } from '@nestjs/jwt';
import { RedisStoreService } from 'src/redis-store/redis-store.service';
import { MediasoupService } from 'src/mediasoup/mediasoup.service';
import { ReplayService } from 'src/replay/replay.service';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
    private inMemoryStore: MemoryStoreService,
    private jwtService: JwtService,
    private redisStore: RedisStoreService,
    private mediasoupService: MediasoupService,
    private replayService: ReplayService,
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
          lang: { $ifNull: [{ $first: '$files.lang' }, 'javascript'] },
          files: { $ifNull: ['$files', []] },
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
      files: createRoom.files,
      accessList: { user: userId, role: AccessRole.OWNER },
    });

    await newRoom.save();

    return newRoom;
  }

  async saveCodeSnapshot(id: string) {
    let ydoc = this.inMemoryStore.crdtRooms.get(id) ?? null;
    if (!ydoc) {
      ydoc = await this.redisStore.getYDoc(`crdt-rooms:${id}`);
    }
    if (!ydoc) return;

    const files = ydocToFiles(ydoc);
    const wbData = ydocToWhiteboardData(ydoc);
    const update: any = { files };
    if (wbData && Object.keys(wbData.records).length > 0) {
      const wbDoc = new Y.Doc();
      const wbMap = wbDoc.getMap<any>('wb');
      for (const [key, value] of Object.entries(wbData.records)) {
        wbMap.set(key, value);
      }
      if (wbData.meta) {
        wbMap.set('__meta', JSON.stringify(wbData.meta));
      }
      update.whiteboardData = Buffer.from(Y.encodeStateAsUpdate(wbDoc));
      update.whiteboardMeta = wbData.meta || null;
      wbDoc.destroy();
    }

    return await this.roomModel.findByIdAndUpdate(id, update, { new: true });
  }

  async updateRoom(id: string, updateRoom: UpdateRoom) {
    await this.redisStore.delete(`active-rooms:${id}`);
    return await this.roomModel.findByIdAndUpdate(id, updateRoom, {
      new: true,
    });
  }

  async deleteRoom(roomId: string) {
    await this.roomModel.findByIdAndDelete(roomId);

    this.inMemoryStore.crdtRooms.delete(roomId);

    await this.redisStore.delete(`active-rooms:${roomId}`);
    await this.redisStore.delete(`crdt-rooms:${roomId}`);

    this.inMemoryStore.closeRoom(roomId);

    await this.replayService.deleteRoomHistory(roomId);

    return true;
  }

  async addUserAccess(roomId: string, userId: string, role: AccessRole) {
    const newAccess = { _id: new Types.ObjectId(), user: userId, role };

    await this.redisStore.delete(`active-rooms:${roomId}`);

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
    await this.redisStore.delete(`active-rooms:${roomId}`);
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
    await this.redisStore.delete(`active-rooms:${roomId}`);
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
      const roomId = client.data.roomId;
      if (!roomId) return;

      const roomDetails = await this.redisStore.get(`active-rooms:${roomId}`);

      if (!roomDetails || !roomDetails.activeUsers.includes(client.id)) return;

      roomDetails.activeUsers = roomDetails.activeUsers.filter(
        (id: string) => id !== client.id,
      );
      if (Array.isArray(roomDetails.activeUserInfos)) {
        roomDetails.activeUserInfos = roomDetails.activeUserInfos.filter(
          (u: any) => u.userId !== client.data.userId,
        );
      }

      if (roomDetails?.activeUsers?.length === 0) {
        await this.saveCodeSnapshot(roomId);

        this.inMemoryStore.crdtRooms.delete(roomId);
        await this.redisStore.delete(`active-rooms:${roomId}`);
        await this.redisStore.delete(`crdt-rooms:${roomId}`);

        this.inMemoryStore.closeRoom(roomId);
      } else {
        await this.redisStore.set(`active-rooms:${roomId}`, roomDetails);

        this.inMemoryStore.closePeer(roomId, client.data.userId);

        client.to(roomId).emit('room:user-left', { userId: client.data.userId });
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
        roomId = await this.redisStore.get(`room-slug:${slug}`);
      }

      let roomDetails = await this.redisStore.get(`active-rooms:${roomId}`);
      let ydoc: Y.Doc;

      if (!roomDetails) {
        if (roomId) roomDetails = await this.getRoomById(roomId);
        else roomDetails = await this.getRoomBySlug(slug);

        if (!roomDetails) {
          client.emit('room:error', 'Room not found');
          return;
        }
        roomId = roomDetails._id.toString();

        if (slug) await this.redisStore.set(`room-slug:${slug}`, roomId);

        roomDetails.activeUsers = [];
        roomDetails.activeUserInfos = [];
        roomDetails.isDirty = false;

        const files = (roomDetails as any).files || [];
        ydoc = stringToYDoc(files.map((f: any) => ({ path: f.path, content: f.content })));
        const filesArr = ydoc.getArray('files');
        ydoc.transact(() => {
          for (const f of files) {
            filesArr.push([{ path: f.path, lang: f.lang || 'javascript' }]);
          }
        });

        populateYdocWhiteboard(
          ydoc,
          (roomDetails as any).whiteboardData || null,
          (roomDetails as any).whiteboardMeta || null,
        );

        this.inMemoryStore.crdtRooms.set(roomId, ydoc);
        await this.redisStore.setYDoc(`crdt-rooms:${roomId}`, ydoc);
        await this.redisStore.set(`active-rooms:${roomId}`, roomDetails);

        const mediaSoupRouter = await this.mediasoupService.createRouter();
        this.inMemoryStore.getOrCreateRoom(roomId, mediaSoupRouter);
      } else {
        if (!roomId && slug) {
          roomId = await this.redisStore.get(`room-slug:${slug}`);
        }

        ydoc =
          this.inMemoryStore.crdtRooms.get(roomId) ||
          (await this.redisStore.getYDoc(`crdt-rooms:${roomId}`)) ||
          new Y.Doc();

        this.inMemoryStore.crdtRooms.set(roomId, ydoc);

        if (!this.inMemoryStore.mediasoupRooms.has(roomId)) {
          const mediaSoupRouter = await this.mediasoupService.createRouter();
          this.inMemoryStore.getOrCreateRoom(roomId, mediaSoupRouter);
        }
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

      await client.join(roomId);

      client.data.roomId = roomId;

      this.inMemoryStore.getOrCreatePeer(roomId, userId);

      if (!Array.isArray(roomDetails.activeUserInfos)) {
        roomDetails.activeUserInfos = [];
      }
      const userInfo = { userId, name: client.data.name, role: hasAccess.role };
      if (!roomDetails.activeUserInfos.some((u: any) => u.userId === userId)) {
        roomDetails.activeUserInfos.push(userInfo);
      }

      await this.redisStore.set(`active-rooms:${roomId}`, roomDetails);

      client.emit('room:current-users', roomDetails.activeUserInfos);
      client.to(roomId).emit('room:user-joined', userInfo);

      const filesList = ydoc.getArray<{ path: string; lang: string }>('files').toArray();

      client.emit(
        'crdt:doc',
        Y.encodeStateAsUpdate(ydoc),
        filesList,
        roomId,
        hasAccess.role,
      );
    } catch (err) {
      console.error('Join error:', err);
      client.emit('room:error', 'Failed to Join Room');
    }
  }

  async handleGetUsers(client: Socket, roomId: string) {
    if (!roomId) return;
    const roomDetails = await this.redisStore.get(`active-rooms:${roomId}`);
    if (!roomDetails) return;
    client.emit('room:current-users', roomDetails.activeUserInfos);
  }

  async leaveRoom(client: Socket) {
    const roomId = client.data.roomId;
    if (!roomId) return;

    const roomDetails = await this.redisStore.get(`active-rooms:${roomId}`);

    if (!roomDetails) return;

    roomDetails.activeUsers = roomDetails.activeUsers.filter(
      (socketId: string) => socketId != client.id,
    );
    if (Array.isArray(roomDetails.activeUserInfos)) {
      roomDetails.activeUserInfos = roomDetails.activeUserInfos.filter(
        (u: any) => u.userId !== client.data.userId,
      );
    }

    if (roomDetails?.activeUsers?.length == 0) {
      await this.saveCodeSnapshot(roomId);
      this.inMemoryStore.crdtRooms.delete(roomId);
      await this.redisStore.delete(`active-rooms:${roomId}`);
      await this.redisStore.delete(`crdt-rooms:${roomId}`);

      this.inMemoryStore.closeRoom(roomId);
    } else {
      await this.redisStore.set(`active-rooms:${roomId}`, roomDetails);

      this.inMemoryStore.closePeer(roomId, client.data.userId);
    }

    client.to(roomId).emit('room:user-left', { userId: client.data.userId });
    client.leave(roomId);
  }
}
