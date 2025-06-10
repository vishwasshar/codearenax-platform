import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel:Model<User>){}

    private users = [{id:1,name:"asdf",email:"asdf@asdf.com",password:"testPass"}];

    getAllUsers(){
        return this.users;
    }

    getUserById(id:number){
        const user = this.users.find((user)=>user.id === id);

        if(!user){
            throw new Error("User Not Found!");
        }

        return user;
    }

    addNewUser(user:UserDto){
        const id = Date.now();

        this.users.push({
            id,
            ...user
        })

        return this.getUserById(id);
    }
}
