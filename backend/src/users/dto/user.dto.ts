import { Transform } from "class-transformer";
import { IsEmail, IsString, MinLength } from "class-validator";

export class UserDto{

    @IsString({message:"Please Enter a valid string"})
    @Transform(({value})=>{
        return value.toLowerCase();
    })
    @MinLength(3,{
        message:"Please enter a valid name"
    })
    name:string;

    @IsEmail({},{message:"Please Enter a valid Email Address"})
    @Transform(({value})=>{
        return value.toLowerCase();
    })
    email:string;
    
    @IsString({message:"Please enter a valid string"})
    @MinLength(8,{message:"Password length must be atleast 8 Characters"})
    password:string;
}