/* eslint-disable no-console */
/**
 * Test de JERARQUÍA con DIRSEND (TipoDefinicion=Disp).
 * Para cada EmpKey: Inicializa (device scope) + GetParametro, y muestra el valor
 * resuelto por el backend y la clave de contexto usada en Redis.
 */
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ParametrosModule, ParametrosService, contextId } = require('../dist');
const { DispositivoService } = require('@andestec/api-dispositivos');

const APP = process.env.PARAM_APLICACION_ID || 'ServidorPOS';
const PARAM = process.env.PARAM || 'DIRSEND';
const EMPKEYS = (process.env.EMPKEYS || '0,9101').split(',').map((s) => Number(s.trim()));

async function main() {
  const app = await NestFactory.createApplicationContext(ParametrosModule, { logger: ['error'] });
  const p = app.get(ParametrosService);
  const disp = app.get(DispositivoService);
  const device = disp.GetDispositivoId();
  console.log(`App=${APP} · Param=${PARAM} · Device=${device}\n`);

  for (const empKey of EMPKEYS) {
    const ok = await p.InicializaParametrosDispositivo(APP, empKey, 'WebApp');
    const valor = await p.GetParametro(PARAM, { aplicacionId: APP, empKey, modo: '' });
    console.log(`EmpKey=${String(empKey).padEnd(6)} inicializa=${ok}  clave=${contextId(APP, empKey, device)}`);
    console.log(`   ${PARAM} = ${JSON.stringify(valor)}\n`);
  }

  await app.close();
  process.exit(0);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
