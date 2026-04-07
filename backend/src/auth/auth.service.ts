import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.senha, user.senha);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { 
      sub: user.idUsuario, 
      email: user.email,
      nivelAcesso: user.nivelAcesso
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        idUsuario: user.idUsuario,
        nome: user.nome,
        email: user.email,
        nivelAcesso: user.nivelAcesso
      }
    };
  }
}
