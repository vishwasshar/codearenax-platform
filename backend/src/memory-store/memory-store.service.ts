import { Injectable } from '@nestjs/common';
import * as Y from 'yjs';

@Injectable()
export class MemoryStoreService {
  // Store detail of rooms (room._id, room - obj.)
  public activeRooms: Map<string, any> = new Map<string, any>();

  // Store YJS Docs for rooms
  public crdtRooms: Map<string, Y.Doc> = new Map<string, Y.Doc>();

  // Store detail of client socket id and user id (client.id, user._id)
  public userIds: Map<string, string> = new Map<string, string>();
}
