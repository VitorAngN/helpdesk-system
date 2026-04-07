import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { NivelAcesso } from '../../generated/prisma';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto, nivelAcesso?: NivelAcesso): Promise<{
        nome: string;
        email: string;
        idUsuario: number;
        nivelAcesso: import("../../generated/prisma").$Enums.NivelAcesso;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByEmail(email: string): Promise<{
        nome: string;
        email: string;
        senha: string;
        idUsuario: number;
        nivelAcesso: import("../../generated/prisma").$Enums.NivelAcesso;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findById(id: number): Promise<{
        nome: string;
        email: string;
        idUsuario: number;
        nivelAcesso: import("../../generated/prisma").$Enums.NivelAcesso;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
}
