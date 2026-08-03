/* eslint-disable no-console */
/** Prueba de lectura simple y compuesta (obtenerValorxIndice). Bootstrap único. */
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ParametrosModule, ParametrosService } = require('../dist');

const APP_ID = process.env.PARAM_APLICACION_ID || 'Cobru';
const EMPKEY = Number(process.env.EMPKEY || 9161);

async function main() {
  const app = await NestFactory.createApplicationContext(ParametrosModule, { logger: ['error'] });
  const p = app.get(ParametrosService);
  const ctx = { aplicacionId: APP_ID, empKey: EMPKEY, alcanceId: '', modo: '' };

  const casos = [
    'AgenteDefault',
    'PI_TipoDefault',       // ".CORREO.DNI.RUT."  (compuesto, sep '.')
    'PI_TipoDefault_1',     // -> CORREO
    'PI_TipoDefault_2',     // -> DNI
    'PI_TipoDefault_3',     // -> RUT
    'PI_TipoDefault_4',     // -> fuera de rango
    'CanalDefault',         // ".PhoneChile."
    'CanalDefault_1',       // -> PhoneChile
  ];

  for (const c of casos) {
    const v = await p.GetParametro(c, ctx);
    console.log(`GetParametro(${JSON.stringify(c)}) = ${JSON.stringify(v)}`);
  }

  await app.close();
  process.exit(0);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
