import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { LangTypes } from 'src/common/enums';
import { AccessRole } from 'src/common/enums/access-role.enum';
import { MemoryStoreService } from 'src/memory-store/memory-store.service';
import { RedisStoreService } from 'src/redis-store/redis-store.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { ReplayService } from 'src/replay/replay.service';
import * as Y from 'yjs';

@Injectable()
export class CrdtService {
  constructor(
    @Inject(forwardRef(() => RoomsService))
    private roomService: RoomsService,
    private inMemoryStore: MemoryStoreService,
    private redisStore: RedisStoreService,
    private replayService: ReplayService,
  ) {}

  private persistTimeouts = new Map<string, NodeJS.Timeout>();

  private schedulePersist(roomId: string) {
    const existing = this.persistTimeouts.get(roomId);
    if (existing) clearTimeout(existing);

    this.persistTimeouts.set(
      roomId,
      setTimeout(async () => {
        const ydoc = this.inMemoryStore.crdtRooms.get(roomId);
        if (ydoc) {
          await this.redisStore.setYDoc(`crdt-rooms:${roomId}`, ydoc);
        }
        this.persistTimeouts.delete(roomId);
      }, 2000),
    );
  }

  async updateRoom(client: Socket, data: { update: number[]; filePath?: string }) {
    const { update, filePath } = data;

    const roomId = client.data.roomId;
    if (!roomId) return;

    const roomDetails = await this.redisStore.get(`active-rooms:${roomId}`);
    const ydoc = this.inMemoryStore.crdtRooms.get(roomId);
    const userId = client.data.userId;

    if (!roomDetails || !ydoc) return;
    if (!userId) return;

    const hasEditAccess = roomDetails?.accessList?.some(
      (u: any) =>
        u?.user?._id?.toString() === userId?.toString() &&
        [AccessRole.OWNER, AccessRole.EDITOR].includes(u.role),
    );

    if (!hasEditAccess) return;

    if (!roomDetails.isDirty) {
      roomDetails.isDirty = true;
      await this.redisStore.set(`active-rooms:${roomId}`, roomDetails);
    }

    const updateBuffer = Uint8Array.from(update);

    const prevStateVector = Y.encodeStateVector(ydoc);
    Y.applyUpdate(ydoc, updateBuffer);
    const serverDelta = Y.diffUpdate(Y.encodeStateAsUpdate(ydoc), prevStateVector);

    this.schedulePersist(roomId);

    client.to(roomId).emit('crdt:code-update', updateBuffer);

    const targetFile = filePath || 'index.js';
    const currentText = ydoc.getText(targetFile).toString();
    this.replayService.recordEdit(roomId, userId, serverDelta, currentText, targetFile).catch(() => {});
  }

  async updateWhiteboard(client: Socket, data: { update: number[] }) {
    const { update } = data;
    const roomId = client.data.roomId;
    if (!roomId) return;

    const roomDetails = await this.redisStore.get(`active-rooms:${roomId}`);
    const ydoc = this.inMemoryStore.crdtRooms.get(roomId);
    const userId = client.data.userId;

    if (!roomDetails || !ydoc) return;
    if (!userId) return;

    const hasEditAccess = roomDetails?.accessList?.some(
      (u: any) =>
        u?.user?._id?.toString() === userId?.toString() &&
        [AccessRole.OWNER, AccessRole.EDITOR].includes(u.role),
    );
    if (!hasEditAccess) return;

    const updateBuffer = Uint8Array.from(update);

    const prevStateVector = Y.encodeStateVector(ydoc);
    Y.applyUpdate(ydoc, updateBuffer);
    const serverDelta = Y.diffUpdate(Y.encodeStateAsUpdate(ydoc), prevStateVector);

    this.schedulePersist(roomId);

    client.to(roomId).emit('crdt:wb-update', updateBuffer);

    this.replayService
      .recordEdit(roomId, userId, serverDelta, undefined, '__whiteboard__', 'whiteboard')
      .catch(() => {});
  }

  async updateRoomLang(client: Socket, data: { lang: LangTypes; filePath?: string }) {
    const { lang, filePath } = data;
    const roomId = client.data.roomId;

    const roomDetails = await this.redisStore.get(`active-rooms:${roomId}`);

    const userId = client.data.userId;

    if (
      !(
        roomDetails &&
        roomDetails?.accessList?.some(
          (u: any) =>
            u.user?._id == userId &&
            (u.role == AccessRole.OWNER || u.role == AccessRole.EDITOR),
        )
      )
    )
      return;

    const ydoc = this.inMemoryStore.crdtRooms.get(roomId);
    if (ydoc && filePath) {
      ydoc.transact(() => {
        const filesArr = ydoc.getArray<{ path: string; lang: string }>('files');
        const files = filesArr.toArray();
        const idx = files.findIndex((f) => f.path === filePath);
        if (idx !== -1) {
          filesArr.delete(idx, 1);
          filesArr.insert(idx, [{ path: filePath, lang }]);
        }
      });
    }

    await this.redisStore.set(`active-rooms:${roomId}`, roomDetails);
    if (filePath) {
      await this.roomService.updateRoom(roomId, { files: [{ path: filePath, lang }] as any });
    }
  }
}
