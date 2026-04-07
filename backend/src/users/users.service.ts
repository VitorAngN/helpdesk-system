import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { NivelAcesso } from '../../generated/prisma';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(
    createUserDto: CreateUserDto,
    nivelAcesso: NivelAcesso = NivelAcesso.cliente,
  ) {
    const userExists = await this.prisma.usuario.findUnique({
      where: { email: createUserDto.email },
    });

    if (userExists) {
      throw new ConflictException('O email já está em uso.');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.senha, salt);

    const user = await this.prisma.usuario.create({
      data: {
        ...createUserDto,
        senha: hashedPassword,
        nivelAcesso,
      },
    });

    const { senha: _, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email } });
  }

  async findById(id: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { idUsuario: id },
    });
    if (user) {
      const { senha: _, ...result } = user;
      return result;
    }
    return null;
  }
}
