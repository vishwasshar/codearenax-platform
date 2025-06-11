import { Transform } from "class-transformer";
import { IsEmail, IsString, MinLength } from "class-validator";

export class UpdateUserDto{

    @IsString({message:"Please Enter a valid string"})
    @Transform(({value})=>{
        return value.toLowerCase();
    })
    @MinLength(3,{
        message:"Please enter a valid name"
    })
    name:string;

}