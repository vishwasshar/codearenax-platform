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
import { MediasoupService } from 'src/mediasoup/mediasoup.service';
import { MemoryStoreService } from 'src/memory-store/memory-store.service';

import { types as mediasoupTypes } from 'mediasoup';
import { MediaKind } from 'mediasoup/node/lib/rtpParametersTypes';

@Injectable()
@WebSocketGateway(3003, { cors: true, namespace: '/room' })
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(forwardRef(() => CrdtService))
    private crdtService: CrdtService,
    private roomService: RoomsService,
    private chatService: ChatService,
    private mediasoupService: MediasoupService,
    private inMemoryStore: MemoryStoreService,
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

  @SubscribeMessage('mediasoup:get-router-rtp-capabilities')
  async getRouterCapabilities(client: Socket, callback: Function) {
    const room = this.inMemoryStore.getOrCreateRoom(client.data.roomId);

    const routerCapabilities =
      await this.mediasoupService.getRouterRtpCapabilities(room.router);

    callback(routerCapabilities);
  }

  @SubscribeMessage('mediasoup:create-webrtc-transport')
  async createWebRtcTransport(client: Socket, callback: Function) {
    const room = this.inMemoryStore.getOrCreateRoom(client.data.roomId);

    const peer = this.inMemoryStore.getOrCreatePeer(
      client.data.roomId,
      client.data.userId,
    );

    const transport = await this.mediasoupService.createTransport(room.router);

    peer.transports.set(transport.id, transport);

    callback({
      id: transport.id,
      iceCandidates: transport.iceCandidates,
      iceParameters: transport.iceParameters,
      dtlsParameters: transport.dtlsParameters,
    });
  }

  @SubscribeMessage('mediasoup:connect-transport')
  async connectTransport(
    client: Socket,
    {
      transportId,
      dtlsParameters,
    }: { transportId: string; dtlsParameters: mediasoupTypes.DtlsParameters },
    callback: Function,
  ) {
    try {
      const peer = this.inMemoryStore.getOrCreatePeer(
        client.data.roomId,
        client.data.userId,
      );

      const transport = peer.transports.get(transportId);

      await transport?.connect({ dtlsParameters });

      callback('success');
    } catch (err) {
      callback('error', err);
    }
  }

  @SubscribeMessage('mediasoup:produce')
  async produce(
    client: Socket,
    {
      transportId,
      kind,
      rtpParameters,
    }: {
      transportId: string;
      kind: MediaKind;
      rtpParameters: mediasoupTypes.RtpParameters;
    },
    callback: Function,
  ) {
    try {
      const peer = this.inMemoryStore.getOrCreatePeer(
        client.data.roomId,
        client.data.userId,
      );

      const transport = peer.transports.get(transportId);
      if (!transport) throw new Error('Transport not found');

      const producer = await this.mediasoupService.createProducer(
        transport,
        kind,
        rtpParameters,
      );

      peer.producers.set(producer.id, producer);

      callback({ id: producer.id });

      client.to(client.data.roomId).emit('newProducer', {
        producerId: producer.id,
        peerId: client.data.userId,
        kind,
      });
    } catch (err) {
      callback('error', err);
    }
  }

  @SubscribeMessage('mediasoup:consume')
  async consume(
    client: Socket,
    {
      transportId,
      producerId,
      rtpCapabilities,
    }: {
      transportId: string;
      producerId: string;
      rtpCapabilities: mediasoupTypes.RtpCapabilities;
    },
    callback: Function,
  ) {
    try {
      const room = this.inMemoryStore.getOrCreateRoom(client.data.roomId);

      const peer = this.inMemoryStore.getOrCreatePeer(
        client.data.roomId,
        client.data.userId,
      );

      const transport = peer.transports.get(transportId);
      if (!transport) throw new Error('Transport not found');

      const consumer = await this.mediasoupService.createConsumer(
        room.router,
        transport,
        producerId,
        rtpCapabilities,
      );

      peer.consumers.set(consumer.id, consumer);

      callback({
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        producerId: producerId,
        type: consumer.type,
      });
    } catch (err) {
      callback('error', err);
    }
  }

  @SubscribeMessage('mediasoup:resume-consumer')
  async resumeConsumer(client: Socket, consumerId: string, callback: Function) {
    try {
      const peer = this.inMemoryStore.getOrCreatePeer(
        client.data.roomId,
        client.data.userId,
      );

      const consumer = peer.consumers.get(consumerId);

      if (!consumer) throw new Error('Consumer not found');

      await consumer.resume();

      callback('success');
    } catch (err) {
      callback('error');
    }
  }

  @SubscribeMessage('mediasoup:close-producer')
  async closeProducer(client: Socket, producerId: string) {
    const peer = this.inMemoryStore.getOrCreatePeer(
      client.data.roomId,
      client.data.userId,
    );

    const producer = peer.producers.get(producerId);

    if (!producer) throw new Error('Producer not found');

    client.to(client.data.roomId).emit('producerClosed', {
      producerId: producer.id,
    });

    producer.close();

    peer.producers.delete(producerId);
  }
}
