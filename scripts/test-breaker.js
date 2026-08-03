/* eslint-disable no-console */
/**
 * Demuestra el circuit-breaker offline. Requiere la caché ya poblada (correr antes
 * con URL buena). Este proceso apunta a un backend inalcanzable:
 *  - Las primeras Inicializa fallan por red → abren el circuito (marcadores Offline).
 *  - Las siguientes OMITEN la llamada remota (rápidas) y usan la caché.
 *  - GetParametro sigue respondiendo desde Redis (el breaker no afecta lecturas).
 */
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ParametrosModule, ParametrosService, REPOSITORIO_PARAMETROS, tagOffline } = require('../dist');
const { DispositivoService } = require('@andestec/api-dispositivos');
const { PersistenciaService } = require('@andestec/persistencia-redis/nestjs');

const APP = process.env.PARAM_APLICACION_ID || 'ServidorPOS';
const EMP = Number(process.env.EMPKEY || 9101);

async function main() {
  const app = await NestFactory.createApplicationContext(ParametrosModule, { logger: ['error'] });
  const p = app.get(ParametrosService);
  const persistencia = app.get(PersistenciaService);
  const off = (svc) => persistencia.repositorio.existe(tagOffline(svc), REPOSITORIO_PARAMETROS);

  console.log(`Backend (inalcanzable): ${process.env.PARAM_API_BASEURL}\n`);
  for (let i = 1; i <= 4; i++) {
    const t0 = Date.now();
    const ok = await p.InicializaParametrosDispositivo(APP, EMP, 'WebApp');
    const dt = Date.now() - t0;
    const offDef = await off(`Definicion_${APP}`);
    const offVal = await off(`Valores_${APP}`);
    console.log(`Inicializa #${i}: ok=${ok}  ${String(dt).padStart(5)}ms  offlineDef=${offDef} offlineVal=${offVal}`);
  }

  const v = await p.GetParametro('DIRSEND', { aplicacionId: APP, empKey: EMP, modo: '' });
  console.log(`\nGetParametro("DIRSEND") desde caché = ${JSON.stringify(v)}`);

  await app.close();
  process.exit(0);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
