/* eslint-disable no-console */
/**
 * Prueba de humo de @andestec/api-parametros contra el backend REST y Redis.
 *
 * Ejecutar desde la raíz del paquete (carga .env de ese directorio):
 *   node scripts/smoke.js
 *
 * Overrides opcionales:
 *   SMOKE_EMPKEY=123 SMOKE_ALCANCE=ALC-01 SMOKE_PARAMETRO=MI_PARAM SMOKE_MODO= node scripts/smoke.js
 */
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const {
  ParametrosModule,
  ParametrosService,
  ConsumoParametrosService,
} = require('../dist');
const { TokenService } = require('@andestec/api-dispositivos');

const APP_ID = process.env.PARAM_APLICACION_ID || 'Cobru';
const MODO = process.env.SMOKE_MODO ?? process.env.PARAM_MODO ?? '';
const EMPKEY = Number(process.env.SMOKE_EMPKEY || 0);
const ALCANCE = process.env.SMOKE_ALCANCE || '';
const PARAMETRO = process.env.SMOKE_PARAMETRO || '';

function titulo(t) {
  console.log('\n' + '='.repeat(60) + '\n' + t + '\n' + '='.repeat(60));
}

function detalleError(e) {
  if (e && e.response) {
    return `HTTP ${e.response.status} · ${JSON.stringify(e.response.data)?.slice(0, 400)}`;
  }
  if (e && e.code) return `${e.code} · ${e.message}`;
  return e && e.message ? e.message : String(e);
}

async function paso(nombre, fn) {
  try {
    const r = await fn();
    console.log(`[OK] ${nombre}`);
    return r;
  } catch (e) {
    console.log(`[ERR] ${nombre}  → ERROR: ${detalleError(e)}`);
    return null;
  }
}

async function main() {
  titulo('CONTEXTO');
  console.log({ APP_ID, MODO, EMPKEY, ALCANCE, PARAMETRO: PARAMETRO || '(ninguno)' });

  const app = await NestFactory.createApplicationContext(ParametrosModule, {
    logger: ['error', 'warn'],
  });

  const consumo = app.get(ConsumoParametrosService);
  const parametros = app.get(ParametrosService);
  const token = app.get(TokenService);

  // 0) Token / identidad
  titulo('0) TOKEN (ApiKey)');
  const tk = token.TokenGen(APP_ID + MODO);
  if (tk) {
    console.log(`[OK] TokenGen ok · len=${tk.length} · prefijo="${tk.slice(0, 40)}..."`);
  } else {
    console.log('[WARN] TokenGen devolvió vacío → revisar DISPOSITIVO_ID / DISPOSITIVO_CLAVE');
  }

  // 1) GetParametroDefinicion
  titulo('1) GET /GetParametroDefinicion');
  const defOut = await paso('getParametroDefinicion', () =>
    consumo.getParametroDefinicion({ aplicacionIdl: APP_ID, modo: MODO }),
  );
  if (defOut) {
    const items = defOut.ParametrosDefinitionApp?.ParametrosItemDefinitionApp ?? [];
    console.log(`   Ok=${defOut.Ok} · definiciones=${items.length} · version=${defOut.ParametrosDefinitionApp?.ParametrosVersion ?? '-'}`);
    if (defOut.Messages?.length) console.log('   Messages:', JSON.stringify(defOut.Messages).slice(0, 300));
    if (items[0]) console.log('   ej[0]:', JSON.stringify({ ParametroId: items[0].ParametroId, TipoDefinicionId: items[0].TipoDefinicionId, ParametroMaxAlcance: items[0].ParametroMaxAlcance }));
  }

  // 2) GetDefinicionEstructuras
  titulo('2) GET /GetDefinicionEstructuras');
  const estOut = await paso('getDefinicionEstructuras', () => consumo.getDefinicionEstructuras());
  if (estOut) {
    const est = estOut.SDTParametroEstructura ?? [];
    console.log(`   Ok=${estOut.Ok} · estructuras=${est.length}`);
    if (estOut.Messages?.length) console.log('   Messages:', JSON.stringify(estOut.Messages).slice(0, 300));
  }

  // 3) GetParametrosValues (todos)
  titulo('3) GET /GetParametrosValues (ParametroId vacío = todos)');
  const valOut = await paso('getParametrosValues', () =>
    consumo.getParametrosValues({
      empKey: EMPKEY,
      parametroId: '',
      alcanceId: ALCANCE,
      ambienteId: '',
      aplicacionIdl: APP_ID,
      modo: MODO,
    }),
  );
  if (valOut) {
    const vals = valOut.ParametrosValuesApp?.ParametroValueArray ?? [];
    console.log(`   Ok=${valOut.Ok} · valores=${vals.length}`);
    if (valOut.Messages?.length) console.log('   Messages:', JSON.stringify(valOut.Messages).slice(0, 300));
  }

  // 4) InicializaParametrosNegocio (flujo completo → escribe en Redis)
  titulo('4) InicializaParametrosNegocio → escribe en Redis');
  const okNeg = await paso('InicializaParametrosNegocio', () =>
    parametros.InicializaParametrosNegocio(APP_ID, EMPKEY, ALCANCE, MODO),
  );
  console.log(`   resultado=${okNeg}`);

  // 5) GetParametro (si se indicó uno)
  if (PARAMETRO) {
    titulo(`5) GetParametro("${PARAMETRO}")`);
    const valor = await paso('GetParametro', () =>
      parametros.GetParametro(PARAMETRO, { aplicacionId: APP_ID, empKey: EMPKEY, alcanceId: ALCANCE, modo: MODO }),
    );
    console.log(`   valor="${valor}"`);
  } else {
    titulo('5) GetParametro — omitido (define SMOKE_PARAMETRO para probarlo)');
  }

  await app.close();
  console.log('\nFin de la prueba de humo.');
  process.exit(0);
}

main().catch((e) => {
  console.error('FATAL:', detalleError(e));
  process.exit(1);
});
