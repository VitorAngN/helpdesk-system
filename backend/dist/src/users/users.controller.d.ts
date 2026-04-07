import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        nome: string;
        email: string;
        idUsuario: number;
        nivelAcesso: import("generated/prisma").$Enums.NivelAcesso;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getProfile(req: any): Promise<{
        nome: string;
        email: string;
        idUsuario: number;
        nivelAcesso: import("generated/prisma").$Enums.NivelAcesso;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
}
