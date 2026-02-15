import { Injectable } from '@nestjs/common';
import { createWorker, types as mediasoupTypes } from 'mediasoup';
import { MediaKind } from 'mediasoup/node/lib/rtpParametersTypes';

const DEFAULT_MEDIA_CODECS: mediasoupTypes.RouterRtpCodecCapability[] = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
  },
];

@Injectable()
export class MediasoupService {
  worker: mediasoupTypes.Worker;

  async onModuleInit() {
    await this.createWorker();
  }

  async onModuleDestroy() {
    this.worker?.close();
  }

  async createWorker() {
    this.worker = await createWorker({
      rtcMinPort: 40000,
      rtcMaxPort: 49999,
    });

    this.worker.on('died', () => {
      console.error('Mediasoup worker died');
      process.exit(1);
    });
  }

  async createRouter(
    mediaCodecs: mediasoupTypes.RouterRtpCodecCapability[] = DEFAULT_MEDIA_CODECS,
  ) {
    return await this.worker.createRouter({ mediaCodecs });
  }

  async getRouterRtpCapabilities(router: mediasoupTypes.Router) {
    return router.rtpCapabilities;
  }

  async createTransport(router: mediasoupTypes.Router) {
    return await router.createWebRtcTransport({
      listenIps: [
        {
          ip: '127.0.0.1',
          announcedIp: undefined,
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });
  }

  async createProducer(
    transport: mediasoupTypes.WebRtcTransport,
    kind: MediaKind,
    rtpParameters: mediasoupTypes.RtpParameters,
    appData?: any,
  ) {
    return await transport.produce({
      kind,
      rtpParameters,
      appData,
    });
  }

  async createConsumer(
    router: mediasoupTypes.Router,
    transport: mediasoupTypes.WebRtcTransport,
    producer: mediasoupTypes.Producer,
    rtpCapabilities: mediasoupTypes.RtpCapabilities,
  ) {
    if (
      !router.canConsume({
        producerId: producer.id,
        rtpCapabilities,
      })
    ) {
      throw new Error("Client can't consume this producer.");
    }

    return await transport.consume({
      producerId: producer.id,
      rtpCapabilities,
      paused: true,
      appData: producer.appData,
    });
  }
}
