import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class User{

    @Prop({required:true})
    name:string;

    @Prop({required:true, unique:true})
    email:string;
    
    @Prop({required:true})
    password:string;
}

// Creating a Schema using a Class
export const UserSchema = SchemaFactory.createForClass(User);