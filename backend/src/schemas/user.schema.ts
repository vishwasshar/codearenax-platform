import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Room } from "./room.schema";
import { UserRoles } from "src/common/enums";


@Schema()
export class User{

    @Prop({required:true})
    name:string;

    @Prop({required:true, unique:true})
    email:string;

    @Prop({required:true, enum:UserRoles, default:UserRoles.USER})
    role:UserRoles;
    
    @Prop({required:true})
    password:string;

    // 1-Many Relationship with Room Schema
    @Prop({type:[{type:mongoose.Schema.Types.ObjectId, ref: 'Room'}]})
    rooms:Room[];
}

// Creating a Schema using a Class
export const UserSchema = SchemaFactory.createForClass(User);