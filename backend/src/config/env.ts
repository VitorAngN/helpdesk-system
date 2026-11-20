import 'dotenv/config';

const obrigatoria = (nome: string): string => {
    const valor = process.env[nome];
    if (!valor) {
        throw new Error(`Variável de ambiente ${nome} não configurada.`);
    }
    return valor;
};

export const env = {
    get jwtSecret(): string {
        return obrigatoria('JWT_SECRET');
    },
    port: Number(process.env.PORT ?? 3000),
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
    uploadsDir: process.env.UPLOADS_DIR ?? './uploads',
};
