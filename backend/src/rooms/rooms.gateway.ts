import { forwardRef, Inject, Injectable } from '@nestjs/common';
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
import { ChatService } from 'src/chat/chat.service';

@Injectable()
@WebSocketGateway(3003, { cors: true, namespace: '/room' })
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(forwardRef(() => CrdtService))
    private crdtService: CrdtService,
    private roomService: RoomsService,
    private chatService: ChatService,
  ) {}

  @WebSocketServer() server: Server;

  handleConnection(client: any, ...args: any[]) {
    this.roomService.handleConnection(client, args);
  }

  handleDisconnect(client: Socket) {
    this.roomService.handleDisconnect(client);
  }

  @SubscribeMessage('room:join')
  handleRoomJoin(client: Socket, roomId: string) {
    this.roomService.handleRoomJoin(client, roomId);
  }

  @SubscribeMessage('room:leave')
  leaveRoom(client: Socket) {
    this.roomService.leaveRoom(client);
  }

  handleRoomDelete(roomId: string) {
    setTimeout(() => {
      this.server.in(roomId).disconnectSockets();
    }, 0);
  }

  @SubscribeMessage('chat:send-message')
  sendMessage(
    client: Socket,
    data: { roomId: string; message: string; tempId: string },
  ) {
    this.chatService.sendMessage(client, data);
  }

  @SubscribeMessage('crdt:code-edit')
  updateRoom(client: Socket, data: { update: number[] }) {
    this.crdtService.updateRoom(client, data);
  }

  @SubscribeMessage('crdt:lang-change')
  async updateRoomLang(client: Socket, data: { lang: LangTypes }) {
    this.crdtService.updateRoomLang(client, data);
  }

  handleCodeOuput(roomId: string, output: string) {
    this.server.to(roomId).emit('crdt:output', output);
  }
}
