import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from 'src/schemas/room.schema';
import { CreateRoom } from './dtos/CreateRoom.dto';
import { UpdateRoom } from './dtos/UpdateRoom.dto';

@Injectable()
export class RoomsService {
  constructor(@InjectModel(Room.name) private roomModel: Model<Room>) {}

  async getAllRooms() {
    return await this.roomModel.find();
  }

  async getRoomById(id: string) {
    return await this.roomModel.findById(id);
  }

  async createNewRoom(createRoom: CreateRoom) {
    return await this.roomModel.create(createRoom);
  }

  async updateRoom(id: string, updateRoom: UpdateRoom) {
    return await this.roomModel.findByIdAndUpdate(id, updateRoom, {
      new: true,
    });
  }
}
