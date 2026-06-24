import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { LangTypes } from 'src/common/enums';
import { AccessRole } from 'src/common/enums/access-role.enum';
import { MemoryStoreService } from 'src/memory-store/memory-store.service';
import { RedisStoreService } from 'src/redis-store/redis-store.service';
import { RoomsService } from 'src/rooms/rooms.service';
import * as Y from 'yjs';

@Injectable()
export class CrdtService {
  constructor(
    @Inject(forwardRef(() => RoomsService))
    private roomService: RoomsService,
    private inMemoryStore: MemoryStoreService,
    private redisStore: RedisStoreService,
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

  async updateRoom(client: Socket, data: { update: number[] }) {
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

    if (!roomDetails.isDirty) {
      roomDetails.isDirty = true;
      await this.redisStore.set(`active-rooms:${roomId}`, roomDetails);
    }

    const updateBuffer = Uint8Array.from(update);
    Y.applyUpdate(ydoc, updateBuffer);

    this.schedulePersist(roomId);

    client.to(roomId).emit('crdt:code-update', updateBuffer);
  }

  async updateRoomLang(client: Socket, data: { lang: LangTypes }) {
    const { lang } = data;
    const roomId = client.data.roomId;

    // const roomDetails = this.inMemoryStore.activeRooms.get(roomId);
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

    roomDetails.lang = lang;
    this.redisStore.set(`active-rooms:${roomId}`, roomDetails);

    await this.roomService.updateRoom(roomId, { lang });
    client.to(roomId).emit('crdt:lang-change', lang);
  }
}
