import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { LangTypes } from "src/common/enums";

@Schema()
export class Room{

    @Prop({required:true})
    name:string;

    @Prop({required:true})
    content:string;

    @Prop({required:true, enum:LangTypes, default:LangTypes.JS})
    lang:LangTypes;

}

export const RoomSchema =  SchemaFactory.createForClass(Room);