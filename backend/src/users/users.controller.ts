import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    // Por padrão a rota aberta de registro vai criar 'cliente' apenas.
    return this.usersService.create(createUserDto);
  }

  // Obterá os dados baseados no Token (implementaremos o guard em breve)
  // @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    // Retornamos o usuário cujo ID está atrelado ao Token validado
    return this.usersService.findById(req.user.idUsuario);
  }
}
