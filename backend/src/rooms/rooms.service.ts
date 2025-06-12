import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from 'src/schemas/room.schema';
import { CreateRoom } from './dtos/CreateRoom.dto';
import { UpdateRoom } from './dtos/UpdateRoom.dto';

@Injectable()
export class RoomsService {

    constructor(@InjectModel(Room.name) private roomModel:Model<Room>){}

    getAllRooms(){
        return this.roomModel.find();
    }

    getRoomById(id:string){
        return this.roomModel.findById(id);
    }

    createNewRoom(createRoom: CreateRoom){
        return this.roomModel.create(createRoom);
    }

    updateRoom(id:string, updateRoom: UpdateRoom){
        return this.roomModel.findByIdAndUpdate(id, updateRoom, {new:true});
    }
}
