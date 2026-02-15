import { Injectable } from '@nestjs/common';
import * as Y from 'yjs';
import { types as mediasoupTypes } from 'mediasoup';

type PeerState = {
  transports: Map<string, mediasoupTypes.WebRtcTransport>;
  producers: Map<string, mediasoupTypes.Producer>;
  consumers: Map<string, mediasoupTypes.Consumer>;
};

type RoomRtcState = {
  router: mediasoupTypes.Router;
  peers: Map<string, PeerState>;
};

@Injectable()
export class MemoryStoreService {
  // // Store detail of rooms (room._id, room - obj.)
  // public activeRooms: Map<string, any> = new Map<string, any>();

  // // Store YJS Docs for rooms
  public crdtRooms: Map<string, Y.Doc> = new Map<string, Y.Doc>();

  // Store slug:mongoose._id for rooms
  // public roomSlug: Map<string, string> = new Map<string, string>();

  // Store Mediasoup room state (roomId -> router + peers).
  public mediasoupRooms: Map<string, RoomRtcState> = new Map();

  getOrCreateRoom(roomId: string, router?: mediasoupTypes.Router) {
    const existing = this.mediasoupRooms.get(roomId);
    if (existing) {
      return existing;
    }

    if (!router) throw new Error('Please pass router');
    const roomState: RoomRtcState = {
      router,
      peers: new Map(),
    };
    this.mediasoupRooms.set(roomId, roomState);
    return roomState;
  }

  getOrCreatePeer(roomId: string, peerId: string) {
    const room = this.mediasoupRooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    const existingPeer = room.peers.get(peerId);
    if (existingPeer) {
      return existingPeer;
    }

    const peerState: PeerState = {
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
    };
    room.peers.set(peerId, peerState);
    return peerState;
  }

  closePeer(roomId: string, peerId: string) {
    const room = this.mediasoupRooms.get(roomId);
    if (!room) {
      return;
    }

    const peer = room.peers.get(peerId);
    if (!peer) {
      return;
    }

    peer.consumers.forEach((consumer) => consumer.close());
    peer.producers.forEach((producer) => producer.close());
    peer.transports.forEach((transport) => transport.close());

    room.peers.delete(peerId);
  }

  closeRoom(roomId: string) {
    const room = this.mediasoupRooms.get(roomId);
    if (!room) {
      return;
    }

    room.peers.forEach((_peer, peerId) => {
      this.closePeer(roomId, peerId);
    });
    room.router.close();
    this.mediasoupRooms.delete(roomId);
  }
}
