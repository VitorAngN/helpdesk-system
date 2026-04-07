import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma Client conectado ao banco de dados com sucesso.');
    } catch (error) {
      this.logger.error('Falha ao conectar no banco de dados.', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
