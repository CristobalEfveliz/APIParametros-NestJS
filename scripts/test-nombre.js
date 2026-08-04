/* eslint-disable no-console */
/** Valida el sufijo por NOMBRE de componente contra el backend real. */
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ParametrosModule, ParametrosService } = require('../dist');
const { DispositivoService } = require('@andestec/api-dispositivos');

const APP = process.env.PARAM_APLICACION_ID || 'ServidorPOS';
const EMP = Number(process.env.EMPKEY || 9101);

async function main() {
  const app = await NestFactory.createApplicationContext(ParametrosModule, { logger: ['error'] });
  const p = app.get(ParametrosService);
  const device = app.get(DispositivoService).GetDispositivoId();
  await p.InicializaParametrosDispositivo(APP, EMP, 'WebApp');
  const ctx = { aplicacionId: APP, empKey: EMP, alcanceId: device, modo: '' };

  const casos = [
    ['ReplicaFolder2SFTPActivaDemoni', '192.168.128.127|55221 (compuesto)'],
    ['ReplicaFolder2SFTPActivaDemoni_Servidor', '192.168.128.127'],
    ['ReplicaFolder2SFTPActivaDemoni_Puerto', '55221'],
    ['TIPDOCOFFLINEMIN_Cantidad1', '20'],
    ['TIPDOCOFFLINEMIN_Cantidad2', '20'],
    ['TIPDOCOFFLINEMIN_Cantidad5', '(vacío, solo hay 4)'],
  ];
  for (const [id, esperado] of casos) {
    const v = await p.GetParametro(id, ctx);
    console.log(`${id.padEnd(42)} = ${JSON.stringify(v)}   (esperado: ${esperado})`);
  }

  await app.close();
  process.exit(0);
}
main().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
