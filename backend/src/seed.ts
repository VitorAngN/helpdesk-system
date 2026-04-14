import { PrismaClient } from './generated/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Povoando o banco de dados com usuários iniciais...');
  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('admin123', saltRounds);
  const agentePassword = await bcrypt.hash('agente123', saltRounds);
  const clientePassword = await bcrypt.hash('cliente123', saltRounds);

  // 1. Criar um Admin
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@helpdesk.com' },
    update: {},
    create: {
      nome: 'Administrador Master',
      email: 'admin@helpdesk.com',
      senha: adminPassword,
      nivelAcesso: 'admin',
    },
  });

  // 2. Criar um Agente
  const agente = await prisma.usuario.upsert({
    where: { email: 'agente@helpdesk.com' },
    update: {},
    create: {
      nome: 'Carlos Silva',
      email: 'agente@helpdesk.com',
      senha: agentePassword,
      nivelAcesso: 'agente',
    },
  });

  // 3. Criar um Cliente
  const cliente = await prisma.usuario.upsert({
    where: { email: 'victor@empresa.com' },
    update: {},
    create: {
      nome: 'Victor Neves',
      email: 'victor@empresa.com',
      senha: clientePassword,
      nivelAcesso: 'cliente',
    },
  });

  console.log('✅ Usuários de teste criados com sucesso:');
  console.log(`- Admin: ${admin.email} (Senha: admin123)`);
  console.log(`- Agente: ${agente.email} (Senha: agente123)`);
  console.log(`- Cliente: ${cliente.email} (Senha: cliente123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
