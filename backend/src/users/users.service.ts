import { Injectable } from '@nestjs/common';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {

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
