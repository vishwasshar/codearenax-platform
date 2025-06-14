import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from 'src/schemas/room.schema';
import { CreateRoom } from './dtos/CreateRoom.dto';
import { UpdateRoom } from './dtos/UpdateRoom.dto';
import { User } from 'src/schemas/user.schema';

@Injectable()
export class RoomsService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getAllRooms() {
    return await this.roomModel.find();
  }

  async getRoomById(id: string) {
    return await this.roomModel.findById(id);
  }

  async createNewRoom(createRoom: CreateRoom, userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) throw new HttpException('User Not Found!', 404);

    const newRoom = await this.roomModel.create(createRoom);

    await user.updateOne({ $push: { rooms: newRoom._id } });

    return newRoom;
  }

  async updateRoom(id: string, updateRoom: UpdateRoom) {
    return await this.roomModel.findByIdAndUpdate(id, updateRoom, {
      new: true,
    });
  }
}
