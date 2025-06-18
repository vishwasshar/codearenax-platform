import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from 'src/schemas/room.schema';
import { CreateRoom } from './dtos/CreateRoom.dto';
import { UpdateRoom } from './dtos/UpdateRoom.dto';
import { AccessRole } from 'src/common/enums/access-role.enum';

@Injectable()
export class RoomsService {
  constructor(@InjectModel(Room.name) private roomModel: Model<Room>) {}

  async getAllRooms() {
    return await this.roomModel.find();
  }

  async getRoomById(id: string) {
    return await this.roomModel.findById(id);
  }

  async createNewRoom(createRoom: CreateRoom, userId: string) {
    const newRoom = await this.roomModel.create({
      ...createRoom,
      accessList: { user: userId, role: AccessRole.OWNER },
    });

    return newRoom;
  }

  async updateRoom(id: string, updateRoom: UpdateRoom) {
    return await this.roomModel.findByIdAndUpdate(id, updateRoom, {
      new: true,
    });
  }
}
