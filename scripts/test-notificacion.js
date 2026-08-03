/* eslint-disable no-console */
/**
 * Demuestra la invalidación por notificación push.
 * Con la persistencia VIGENTE (dentro de la ventana de frescura), una Inicializa
 * normal NO refresca. Tras notificarRefresco(), la siguiente Inicializa SÍ refresca.
 *
 * Prueba: se borra una definición de Redis (simula drift). Sin notificación no se
 * restaura; con notificación sí.
 */
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const {
  ParametrosModule,
  ParametrosService,
  REPOSITORIO_PARAMETROS,
  tagDefinicion,
} = require('../dist');
const { DispositivoService } = require('@andestec/api-dispositivos');
const { PersistenciaService } = require('@andestec/persistencia-redis/nestjs');

const APP = process.env.PARAM_APLICACION_ID || 'ServidorPOS';
const EMP = Number(process.env.EMPKEY || 9101);
const DEFPARAM = process.env.PARAM || 'DIRSEND';

async function main() {
  const app = await NestFactory.createApplicationContext(ParametrosModule, { logger: ['error'] });
  const p = app.get(ParametrosService);
  const disp = app.get(DispositivoService);
  const persistencia = app.get(PersistenciaService);
  const device = disp.GetDispositivoId();
  const defKey = tagDefinicion(DEFPARAM);
  const existeDef = () => persistencia.repositorio.existe(defKey, REPOSITORIO_PARAMETROS);

  // 1) Primera Inicializa: no vigente → refresca y puebla.
  await p.InicializaParametrosDispositivo(APP, EMP, ''); // modo '' → respeta vigencia
  console.log(`[1] tras Inicializa inicial · Definicion${DEFPARAM} en Redis = ${await existeDef()}`);

  // 2) Simular drift: borrar la definición de Redis.
  await persistencia.repositorio.eliminar(defKey, REPOSITORIO_PARAMETROS);
  console.log(`[2] borrada Definicion${DEFPARAM} · en Redis = ${await existeDef()}`);

  // 3) Inicializa VIGENTE y SIN notificación → NO refresca (sigue borrada).
  await p.InicializaParametrosDispositivo(APP, EMP, '');
  const trasSinNotif = await existeDef();
  console.log(`[3] Inicializa (vigente, sin notif) · restaurada = ${trasSinNotif}  ${trasSinNotif ? '✗ (no debía)' : '✓ (no refrescó)'}`);

  // 4) Notificar refresco del scope (app, empresa, dispositivo).
  await p.notificarRefresco(APP, EMP, device);
  console.log(`[4] notificarRefresco(${APP}, ${EMP}, ${device})`);

  // 5) Inicializa con notificación pendiente → refresca (restaura la definición).
  await p.InicializaParametrosDispositivo(APP, EMP, '');
  const trasConNotif = await existeDef();
  console.log(`[5] Inicializa (vigente, con notif) · restaurada = ${trasConNotif}  ${trasConNotif ? '✓ (refrescó por notificación)' : '✗'}`);

  await app.close();
  process.exit(0);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
