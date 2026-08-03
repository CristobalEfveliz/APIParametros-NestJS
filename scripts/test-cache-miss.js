/* eslint-disable no-console */
/**
 * Verifica la caché en proceso (hits, y "miss" cacheado) SIN reintroducir staleness
 * larga: el memo se acota a la ventana de frescura y se limpia en Inicializa.
 *
 * Prueba: pobla, borra el blob de Redis, y confirma que un hit sigue respondiendo
 * desde el memo (prueba de caché positiva). Además valida el negativo de definición.
 */
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const {
  ParametrosModule,
  ParametrosService,
  contextId,
  REPOSITORIO_PARAMETROS,
} = require('../dist');
const { DispositivoService } = require('@andestec/api-dispositivos');
const { PersistenciaService } = require('@andestec/persistencia-redis/nestjs');

const APP = process.env.PARAM_APLICACION_ID || 'ServidorPOS';
const EMP = Number(process.env.EMPKEY || 9101);
const PARAM = process.env.PARAM || 'DIRSEND';
const INEXISTENTE = 'ZZZ_NO_EXISTE_' + APP;

async function main() {
  const app = await NestFactory.createApplicationContext(ParametrosModule, { logger: ['error'] });
  const p = app.get(ParametrosService);
  const disp = app.get(DispositivoService);
  const persistencia = app.get(PersistenciaService);
  const device = disp.GetDispositivoId();
  const ctx = { aplicacionId: APP, empKey: EMP, modo: '' };

  // 1) Poblar (Inicializa limpia el memo al final).
  await p.InicializaParametrosDispositivo(APP, EMP, 'WebApp');
  const clave = contextId(APP, EMP, device); // clave del blob de valores para Disp

  // 2) Primer GetParametro: lee Redis y memoriza.
  const v1 = await p.GetParametro(PARAM, ctx);
  console.log(`[1] ${PARAM} = ${JSON.stringify(v1)}   (leído de Redis y memorizado)`);

  // 3) Borrar el blob de Redis del contexto.
  const borradas = await persistencia.repositorio.eliminar(clave, REPOSITORIO_PARAMETROS);
  console.log(`[·] blob Redis "${REPOSITORIO_PARAMETROS}:${clave}" borrado (${borradas})`);

  // 4) Segundo GetParametro: Redis ya no tiene el blob → si responde, es CACHÉ.
  const v2 = await p.GetParametro(PARAM, ctx);
  console.log(`[2] ${PARAM} = ${JSON.stringify(v2)}   (Redis vacío → viene del memo)`);
  console.log(`    >> caché positiva ${v2 === v1 && v2 !== '' ? 'OK ✓' : 'FALLA ✗'}`);

  // 5) Miss de definición: parámetro inexistente (se cachea el negativo NoExiste).
  const m1 = await p.GetParametro(INEXISTENTE, ctx);
  const m2 = await p.GetParametro(INEXISTENTE, ctx);
  console.log(`[miss] ${INEXISTENTE} = ${JSON.stringify(m1)} / ${JSON.stringify(m2)}   (2ª desde memo NoExiste)`);
  console.log(`    >> caché negativa ${m1 === '' && m2 === '' ? 'OK ✓' : 'FALLA ✗'}`);

  await app.close();
  process.exit(0);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
