import { config } from 'dotenv';
import * as path from 'path';
config({ path: path.join(__dirname, '../.env') });

import { PrismaClient, NivelAcesso } from '../generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o script de Seed...');

  const adminEmail = 'admin@helpdesk.com';
  
  const existingAdmin = await prisma.usuario.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log(`Admin ${adminEmail} já existe no banco de dados. Ignorando seed.`);
    return;
  }

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash('123456', salt);

  const admin = await prisma.usuario.create({
    data: {
      nome: 'Administrador do Sistema',
      email: adminEmail,
      senha: hashedPassword,
      nivelAcesso: NivelAcesso.admin,
    }
  });

  console.log(`✅ Admin criado com sucesso! Email: ${admin.email} / Senha: (a que está no código 123456)`);
}

main()
  .catch((e) => {
    console.error('Um erro ocorreu durante a execução do seed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
