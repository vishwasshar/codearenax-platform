import { Injectable } from '@nestjs/common';

@Injectable()
export class MemoryStoreService {
  // Store detail of rooms (room._id, room - obj.)
  public activeRooms: Map<string, any> = new Map<string, any>();

  // Store detail of client socket id and user id (client.id, user._id)
  public userIds: Map<string, string> = new Map<string, string>();
}
