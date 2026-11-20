// Gera docs/api/openapi.json a partir do código (usado pelo GitHub Pages).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { gerarOpenApi } from '../src/openapi.js';

const destino = resolve(process.argv[2] ?? '../docs/api/openapi.json');
mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, JSON.stringify(gerarOpenApi(), null, 2) + '\n');
console.log(`OpenAPI gerado em ${destino}`);
