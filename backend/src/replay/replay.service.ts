import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EditHistory } from 'src/schemas/edit-history.schema';
import { ReplaySession } from 'src/schemas/replay-session.schema';

@Injectable()
export class ReplayService {
  constructor(
    @InjectModel(EditHistory.name)
    private editHistoryModel: Model<EditHistory>,
    @InjectModel(ReplaySession.name)
    private replaySessionModel: Model<ReplaySession>,
  ) {}

  async startSession(roomId: string, ydocState: Uint8Array) {
    await this.replaySessionModel.create({
      roomId,
      initialState: Buffer.from(ydocState),
      createdAt: new Date(),
    });
  }

  async getSessions(roomId: string) {
    const docs = await this.replaySessionModel
      .find({ roomId })
      .select('initialState createdAt')
      .sort({ createdAt: 1 });

    return docs.map((d) => {
      const obj = d.toObject();
      const buf = this.toBuffer(obj.initialState);
      return {
        initialState: buf.length > 0 ? [...buf] : null,
        createdAt: obj.createdAt,
      };
    });
  }

  async recordEdit(roomId: string, userId: string, update: Uint8Array, text?: string) {
    await this.editHistoryModel.create({
      roomId,
      userId,
      update: Buffer.from(update),
      text: text || undefined,
      timestamp: new Date(),
    });
  }

  private toBuffer(raw: any): Buffer {
    if (Buffer.isBuffer(raw)) return raw;
    if (raw?.buffer) return Buffer.from(raw.buffer);
    if (raw?.sub_type != null && raw?.buffer) return Buffer.from(raw.buffer);
    if (typeof raw === 'object' && raw?.type === 'Buffer' && Array.isArray(raw.data))
      return Buffer.from(raw.data);
    return Buffer.from(raw || []);
  }

  async getEdits(roomId: string) {
    const docs = await this.editHistoryModel
      .find({ roomId })
      .select('update timestamp userId text')
      .sort({ timestamp: 1 });

    const results: any[] = [];
    for (const d of docs) {
      const obj = d.toObject();
      const buf = this.toBuffer(obj.update);
      if (buf.length === 0) continue;
      results.push({
        update: [...buf],
        text: obj.text || undefined,
        timestamp: obj.timestamp,
        userId: obj.userId,
      });
    }
    return results;
  }

  async deleteRoomHistory(roomId: string) {
    await this.editHistoryModel.deleteMany({ roomId });
    await this.replaySessionModel.deleteMany({ roomId });
  }
}
