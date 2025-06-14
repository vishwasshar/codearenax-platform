import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { CreateUserDto } from './dto/CreateUser.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async getAllUsers() {
    return await this.userModel.find();
  }

  async getUserById(id: number) {
    return await this.userModel.findById(id);
  }

  async addNewUser(user: CreateUserDto) {
    return await this.userModel.create(user);
  }

  async updateUser(id: string, updatedUser: UpdateUserDto) {
    return await this.userModel.findOneAndUpdate({ _id: id }, updatedUser, {
      new: true,
    });
  }
}
