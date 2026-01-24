import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { LangTypes } from 'src/common/enums';
import { AccessRole } from 'src/common/enums/access-role.enum';
import { MemoryStoreService } from 'src/memory-store/memory-store.service';
import { RoomsService } from 'src/rooms/rooms.service';
import * as Y from 'yjs';

@Injectable()
export class CrdtService {
  constructor(
    @Inject(forwardRef(() => RoomsService))
    private roomService: RoomsService,
    private inMemoryStore: MemoryStoreService,
  ) {}

  updateRoom(client: Socket, data: { update: number[] }) {
    const { update } = data;

    const roomId = client.data.roomId;

    const roomDetails = this.inMemoryStore.activeRooms.get(roomId);
    const ydoc = this.inMemoryStore.crdtRooms.get(roomId);
    const userId = client.data.userId;

    if (!roomDetails || !ydoc) return;
    if (!client.data.userId) return;

    const hasEditAccess = roomDetails.accessList?.some(
      (u: any) =>
        u?.user?.toString() === userId?.toString() &&
        [AccessRole.OWNER, AccessRole.EDITOR].includes(u.role),
    );

    if (!hasEditAccess) return;

    if (!roomDetails.isDirty) {
      roomDetails.isDirty = true;
      this.inMemoryStore.activeRooms.set(roomId, roomDetails);
    }

    const updateBuffer = Uint8Array.from(update);
    Y.applyUpdate(ydoc, updateBuffer);

    client.to(roomId).emit('crdt:code-update', updateBuffer);
  }

  async updateRoomLang(client: Socket, data: { lang: LangTypes }) {
    const { lang } = data;
    const roomId = client.data.roomId;

    const roomDetails = this.inMemoryStore.activeRooms.get(roomId);

    const userId = client.data.userId;

    if (
      !(
        roomDetails &&
        roomDetails?.accessList?.some(
          (user: any) =>
            user.user == userId &&
            (user.role == AccessRole.OWNER || user.role == AccessRole.EDITOR),
        )
      )
    )
      return;

    roomDetails.lang = lang;
    this.inMemoryStore.activeRooms.set(roomId, roomDetails);

    await this.roomService.updateRoom(roomId, { lang });
    client.to(roomId).emit('crdt:lang-change', lang);
  }
}
