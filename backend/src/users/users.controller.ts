import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseIntPipe, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('users')
export class UsersController {

    // Dependency Injection of User Service Class
    constructor(private readonly usersService:UsersService){}
    
    @Get()
    getAllUsers(){
        return this.usersService.getAllUsers();
    }

    @Get(":id")
    getUserById(@Param("id",ParseIntPipe) id:number){
        try{
            return this.usersService.getUserById(+id);
        }catch(error){
            throw new NotFoundException(error.message);
        }
    }

    @Post()
    // Added Basic Request Guard
    @UseGuards(AuthGuard)
    // Added Validation Pipe for Incoming Data and applied Transformation (Class-Validator and Class-Transformer Packages)
    addNewUser(@Body(new ValidationPipe({transform:true})) user:UserDto){
        try{
            return this.usersService.addNewUser(user);
        }
        catch(error){
            throw new BadRequestException(error.message);
        }

    }
}
