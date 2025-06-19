import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AccessRole } from 'src/common/enums/access-role.enum';
import { RoomsService } from 'src/rooms/rooms.service';

@WebSocketGateway(3002, { cors: { origin: '*' } })
export class CodeSyncGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private jwtService: JwtService,
    private readonly roomsService: RoomsService,
  ) {
    // Invoke the interval function when class is initialised.
    this.syncInterval();
  }

  @WebSocketServer() server: Server;

  syncInterval() {
    // syncRooms function is binded with this scope for every 50 Seconds.
    setInterval(this.syncRooms.bind(this), 50000);
  }

  async syncRooms() {
    if (!this.activeRooms) return;
    for (const [roomId, room] of this.activeRooms?.entries()) {
      // Check if room have any update and then update it on server accordingly
      if (room.isDirty) {
        await this.roomsService.updateRoom(roomId, room);

        // Resetting the dirty state to false after update
        room.isDirty = false;

        this.activeRooms.set(roomId, room);
      }
    }
  }

  // Store detail of rooms (room._id, room - obj.)
  private activeRooms: Map<string, any> = new Map<string, any>();

  // Store detail of client socket id and user id (client.id, user._id)
  private userIds: Map<string, string> = new Map<string, string>();

  // Handle user socket connection request
  async handleConnection(client: any, ...args: any[]) {
    try {
      const user = await this.jwtService.verify(client.handshake.auth.token, {
        secret: process.env.JWT_SECRET,
      });

      this.userIds.set(client.id, user._id);
    } catch (err) {
      client.disconnect();
    }
  }

  // Handle user socket disconnect request
  handleDisconnect(client: any) {
    try {
      const rooms = Array.from(client);

      // Iterate over all users active rooms
      rooms.forEach(async (roomId: string) => {
        let roomDetails = this.activeRooms
          .get(roomId)
          .activeUsers.filter((user: any) => user != client.id);

        // If room doesn't have any active user then update to DB.
        if (roomDetails.activeUsers.length == 0) {
          await this.roomsService.updateRoom(roomId, roomDetails);
          this.activeRooms.delete(roomId);
        } else {
          this.activeRooms.set(roomId, roomDetails);
        }
      });
    } catch (err) {}
  }

  // Handle User Room Join Request
  @SubscribeMessage('room:join')
  async handleRoomJoin(client: Socket, roomId: string) {
    try {
      let room: any;

      // Check If user avaiable inMemory else fetched from DB and stored to inMemory
      if (this.activeRooms.has(roomId)) {
        room = this.activeRooms.get(roomId);
      } else {
        room = await this.roomsService.getRoomById(roomId);

        room.activeUsers = [];
        room.isDirty = false;
        this.activeRooms.set(roomId, room);
      }

      // Check if user present in access list of room
      //   IF exists then join the room and add socket id to active user list of room.
      //   ELSE Through Error
      if (
        room?.accessList?.some(
          (user: any) => user.user == this.userIds.get(client.id),
        )
      ) {
        let room = this.activeRooms.get(roomId);
        room.activeUsers.push(client.id);

        this.activeRooms.set(roomId, room);

        client.join(roomId);

        const { content, lang } = this.activeRooms.get(roomId);

        client.emit('room:init', { content, lang });
      } else {
        client.emit('room:error', 'Not Accessible');
      }
    } catch (err) {
      console.log(err);
      client.emit('room:error', 'Failed to Join Room');
    }
  }

  // Handle User leave any room
  @SubscribeMessage('room:leave')
  async handleRoomLeave(client: Socket, roomId: string) {
    try {
      let room: any = this.activeRooms.get(roomId);

      // If the room is empty then save it to DB.
      if (room.activeUsers.length == 0) {
        await this.roomsService.updateRoom(roomId, room);
        this.activeRooms.delete(roomId);
      } else {
        this.activeRooms.set(roomId, room);
      }

      client.leave(roomId);
    } catch (err) {
      client.emit('room:error', 'Failed to leave Room');
    }
  }

  // Handle the edit request on the file.
  @SubscribeMessage('room:edit')
  handleNewMessage(client: Socket, message: any) {
    let room = this.activeRooms.get(message.roomId);

    const userId = this.userIds.get(client.id);

    // Check if user have authorization to edit the file
    if (
      room &&
      room?.accessList?.some(
        (user: any) =>
          user.user == userId &&
          (user.role == AccessRole.OWNER || user.role == AccessRole.EDITOR),
      )
    ) {
      room.content = message.content;
      room.lang = message.lang;
      // Setting Dirty State to true if there any update in the room content.
      room.isDirty = true;

      // Updating Code in inMemory Storage
      this.activeRooms.set(message.roomId, room);

      // Sending received data to all of the active socket members
      client.to(message.roomId).emit('room:update', message);
    }
  }
}
