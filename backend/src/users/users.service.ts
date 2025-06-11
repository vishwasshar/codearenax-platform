import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { CreateUserDto } from './dto/CreateUser.dto';
import { UpdateUserDto } from './dto/UpdateUser.dto';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel:Model<User>){}

    private users = [{id:1,name:"asdf",email:"asdf@asdf.com",password:"testPass"}];

    getAllUsers(){
        return this.userModel.find();
    }
    
    getUserById(id:number){
        return this.userModel.findById(id);
    }
    
    addNewUser(user:CreateUserDto){
        return this.userModel.create(user);
    }

    updateUser(id:string, updatedUser:UpdateUserDto){
        return this.userModel.findByIdAndUpdate(id,updatedUser,{new:true})
    }
}
