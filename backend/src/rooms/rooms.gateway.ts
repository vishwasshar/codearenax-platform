import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
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
  async getRouterRtpCapabilities(client: Socket) {
    const room = this.inMemoryStore.getOrCreateRoom(client.data.roomId);
    return room.router.rtpCapabilities;
  }

  @SubscribeMessage('mediasoup:create-webrtc-transport')
  async createWebRtcTransport(client: Socket) {
    const room = this.inMemoryStore.getOrCreateRoom(client.data.roomId);
    const peer = this.inMemoryStore.getOrCreatePeer(
      client.data.roomId,
      client.data.userId,
    );

    const transport = await this.mediasoupService.createTransport(room.router);

    peer.transports.set(transport.id, transport);

    return {
      id: transport.id,
      iceCandidates: transport.iceCandidates,
      iceParameters: transport.iceParameters,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  @SubscribeMessage('mediasoup:connect-transport')
  async connectTransport(client: Socket, { transportId, dtlsParameters }) {
    const peer = this.inMemoryStore.getOrCreatePeer(
      client.data.roomId,
      client.data.userId,
    );

    const transport = peer.transports.get(transportId);
    await transport?.connect({ dtlsParameters });

    return { success: true };
  }

  @SubscribeMessage('mediasoup:produce')
  async produce(client: Socket, payload: any) {
    const { transportId, kind, rtpParameters, appData } = payload;

    const room = this.inMemoryStore.getOrCreateRoom(client.data.roomId);
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
      appData,
    );

    producer.on('transportclose', () => {
      producer.close();
      peer.producers.delete(producer.id);

      this.server.to(client.data.roomId).emit('producerClosed', producer.id);
    });

    peer.producers.set(producer.id, producer);

    client.to(client.data.roomId).emit('newProducer', {
      producerId: producer.id,
      peerId: client.data.userId,
      appData,
    });

    return { id: producer.id };
  }

  @SubscribeMessage('mediasoup:consume')
  async consume(client: Socket, payload: any) {
    const { transportId, producerId, rtpCapabilities } = payload;

    const room = this.inMemoryStore.getOrCreateRoom(client.data.roomId);
    const peer = this.inMemoryStore.getOrCreatePeer(
      client.data.roomId,
      client.data.userId,
    );

    const transport = peer.transports.get(transportId);
    if (!transport) throw new Error('Transport not found');

    // 🔥 Find Producer
    let producer: mediasoupTypes.Producer | undefined;

    for (const p of room.peers.values()) {
      const found = p.producers.get(producerId);
      if (found) {
        producer = found;
        break;
      }
    }

    if (!producer) throw new Error('Producer not found');

    const consumer = await this.mediasoupService.createConsumer(
      room.router,
      transport,
      producer,
      rtpCapabilities,
    );

    consumer.on('transportclose', () => {
      consumer.close();
      peer.consumers.delete(consumer.id);
    });

    consumer.on('producerclose', () => {
      consumer.close();
      peer.consumers.delete(consumer.id);

      this.server.to(client.id).emit('producerClosed', producerId);
    });

    peer.consumers.set(consumer.id, consumer);

    return {
      id: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      appData: consumer.appData,
    };
  }

  @SubscribeMessage('mediasoup:resume-consumer')
  async resumeConsumer(client: Socket, consumerId: string) {
    const peer = this.inMemoryStore.getOrCreatePeer(
      client.data.roomId,
      client.data.userId,
    );

    const consumer = peer.consumers.get(consumerId);
    await consumer?.resume();

    return { success: true };
  }

  @SubscribeMessage('mediasoup:get-existing-producers')
  async getExistingProducers(client: Socket) {
    const room = this.inMemoryStore.getOrCreateRoom(client.data.roomId);

    const producers: {
      producerId: string;
      peerId: string;
      appData: mediasoupTypes.AppData;
    }[] = [];

    for (const [peerId, peer] of room.peers.entries()) {
      for (const producer of peer.producers.values()) {
        if (peerId === client.data.userId) continue;

        producers.push({
          producerId: producer.id,
          peerId,
          appData: producer.appData,
        });
      }
    }

    return producers;
  }
}
