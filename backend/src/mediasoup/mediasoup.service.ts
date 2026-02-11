import { Injectable } from '@nestjs/common';
import { createWorker, types as mediasoupTypes } from 'mediasoup';
import {
  MediaKind,
  RtpCapabilities,
} from 'mediasoup/node/lib/rtpParametersTypes';

const DEFAULT_MEDIA_CODECS: mediasoupTypes.RtpCodecCapability[] = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
    preferredPayloadType: 0,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 900000,
    preferredPayloadType: 0,
  },
];

@Injectable()
export class MediasoupService {
  worker: mediasoupTypes.Worker;

  constructor() {}

  async onModuelInit() {
    await this.createWorker();
  }

  async onModuleDestroy() {
    this.worker?.close();
  }

  async createWorker() {
    this.worker = await createWorker({
      rtcMinPort: 400000,
      rtcMaxPort: 499999,
    });

    this.worker.on('died', () => {
      console.error('Worker died');
    });
  }

  async createRouter(
    mediaCodecs: mediasoupTypes.RtpCodecCapability[] = DEFAULT_MEDIA_CODECS,
  ) {
    if (!this.worker) {
      await this.createWorker();
    }
    return await this.worker!.createRouter({ mediaCodecs });
  }

  async getRouterRtpCapabilities(router: mediasoupTypes.Router) {
    return router.rtpCapabilities;
  }

  async createTransport(router: mediasoupTypes.Router) {
    return await router.createWebRtcTransport({
      listenIps: [{ ip: '0.0.0.0' }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });
  }

  async createProducer(
    transport: mediasoupTypes.WebRtcTransport,
    kind: MediaKind,
    rtpParameters: mediasoupTypes.RtpParameters,
  ) {
    return await transport.produce({
      kind,
      rtpParameters,
    });
  }

  async createConsumer(
    router: mediasoupTypes.Router,
    transport: mediasoupTypes.WebRtcTransport,
    producerId: string,
    rtpCapabilities: mediasoupTypes.RtpCapabilities,
  ) {
    if (!router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error("Client can't consume this producer.");
    }
    return await transport.consume({ producerId, rtpCapabilities });
  }
}
