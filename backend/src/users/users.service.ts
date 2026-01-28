import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { CreateUserDto } from './dto/CreateUser.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findUsers(keyword: string) {
    return await this.userModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { email: { $regex: keyword, $options: 'i' } },
        ],
      })
      .limit(3);
  }

  async getAllUsers() {
    return await this.userModel.find();
  }

  async getUserById(id: number) {
    return await this.userModel.findById(id);
  }

  async addNewUser(user: CreateUserDto) {
    const newUser = new this.userModel(user);
    return newUser.save();
  }

  async updateUser(id: string, updatedUser: UpdateUserDto) {
    return await this.userModel.findOneAndUpdate({ _id: id }, updatedUser, {
      new: true,
    });
  }
}
