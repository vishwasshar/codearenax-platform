import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from 'src/rooms/rooms.service';
import { LangTypes } from 'src/common/enums';
import { CrdtService } from 'src/crdt/crdt.service';

@Injectable()
@WebSocketGateway(3003, { cors: true })
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private roomService: RoomsService,
    private crdtService: CrdtService,
  ) {}

  @WebSocketServer() server: Server;

  async handleConnection(client: any, ...args: any[]) {
    this.roomService.handleConnection(client, args);
  }

  async handleDisconnect(client: Socket) {
    this.roomService.handleDisconnect(client);
  }

  @SubscribeMessage('room:join')
  async handleRoomJoin(client: Socket, roomId: string) {
    this.roomService.handleRoomJoin(client, roomId);
  }

  @SubscribeMessage('room:leave')
  async leaveRoom(client: Socket, roomId: string) {
    this.roomService.leaveRoom(client, roomId);
  }

  @SubscribeMessage('crdt:code-edit')
  updateRoom(client: Socket, data: { roomId: string; update: number[] }) {
    this.crdtService.updateRoom(client, data);
  }

  @SubscribeMessage('crdt:lang-change')
  async updateRoomLang(
    client: Socket,
    data: { roomId: string; lang: LangTypes },
  ) {
    this.crdtService.updateRoomLang(client, data);
  }

  handleCodeOuput(roomId: string, output: string) {
    this.server.to(roomId).emit('crdt:output', output);
  }
}
