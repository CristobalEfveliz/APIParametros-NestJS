/* eslint-disable no-console */
/**
 * Prueba parametrizable de @andestec/api-parametros.
 *
 * Verifica:
 *   1. Identidad del dispositivo (env DISPOSITIVO_ID / DISPOSITIVO_CLAVE).
 *   2. Obtención del AMBIENTE desde la API de Dispositivos (GetDispositivoAmbiente).
 *   3. Backend REST de Parámetros (definición, estructuras, valores) con el ApiKey.
 *   4. Inicializa + GetParametro contra Redis, usando el ambiente resuelto.
 *
 * Uso (todo opcional; empKey es lo primero para cambiarlo fácil):
 *   node scripts/prueba-parametros.js <empKey> [alcance] [parametro] [modo]
 *
 * Equivalente por flags o variables de entorno:
 *   node scripts/prueba-parametros.js --empkey=123 --alcance=ALC-01 --parametro=AgenteDefault
 *   EMPKEY=123 ALCANCE=ALC-01 PARAMETRO=AgenteDefault MODO= node scripts/prueba-parametros.js
 *
 * Ejemplos:
 *   node scripts/prueba-parametros.js 456
 *   node scripts/prueba-parametros.js 456 "" AgenteDefault
 */
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const {
  ParametrosModule,
  ParametrosService,
  ConsumoParametrosService,
} = require('../dist');
const { DispositivoService, TokenService } = require('@andestec/api-dispositivos');

// --------------------------- Parseo de argumentos ---------------------------
function parseArgs(argv) {
  const flags = {};
  const pos = [];
  for (const a of argv) {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    if (m) flags[m[1].toLowerCase()] = m[2];
    else pos.push(a);
  }
  return { flags, pos };
}
const { flags, pos } = parseArgs(process.argv.slice(2));

const APP_ID = flags.appid || process.env.PARAM_APLICACION_ID || 'Cobru';
const EMPKEY = Number(flags.empkey ?? pos[0] ?? process.env.EMPKEY ?? 0);
const ALCANCE = flags.alcance ?? pos[1] ?? process.env.ALCANCE ?? '';
const PARAMETRO = flags.parametro ?? pos[2] ?? process.env.PARAMETRO ?? '';
const MODO = flags.modo ?? pos[3] ?? process.env.MODO ?? process.env.PARAM_MODO ?? '';

function titulo(t) {
  console.log('\n' + '='.repeat(62) + '\n' + t + '\n' + '='.repeat(62));
}
function detalleError(e) {
  if (e && e.response) return `HTTP ${e.response.status} · ${JSON.stringify(e.response.data)?.slice(0, 400)}`;
  if (e && e.code) return `${e.code} · ${e.message}`;
  return e && e.message ? e.message : String(e);
}
async function paso(nombre, fn) {
  try {
    const r = await fn();
    console.log(`[OK] ${nombre}`);
    return r;
  } catch (e) {
    console.log(`[ERR] ${nombre} -> ${detalleError(e)}`);
    return null;
  }
}

async function main() {
  titulo('CONFIGURACIÓN');
  console.log({ APP_ID, EMPKEY, ALCANCE: ALCANCE || '(vacío)', PARAMETRO: PARAMETRO || '(ninguno)', MODO: MODO || '(vacío)' });

  const app = await NestFactory.createApplicationContext(ParametrosModule, { logger: ['error', 'warn'] });
  const dispositivo = app.get(DispositivoService);
  const token = app.get(TokenService);
  const consumo = app.get(ConsumoParametrosService);
  const parametros = app.get(ParametrosService);

  // 1) Identidad
  titulo('1) IDENTIDAD DEL DISPOSITIVO');
  const dispId = dispositivo.GetDispositivoId();
  const dispClave = dispositivo.GetDispositivoClave();
  console.log(`DispositivoId: ${dispId || '(vacío)'} · Clave: ${dispClave ? '(presente)' : '(vacía)'}`);
  if (!dispId || !dispClave) console.log('[WARN] Falta identidad → el token/ApiKey y el ambiente fallarán.');

  // 2) AMBIENTE desde la API de Dispositivos (requisito)
  titulo('2) AMBIENTE (api-dispositivos → GetDispositivoAmbiente)');
  const ambiente = await paso('GetDispositivoAmbiente', () => dispositivo.GetDispositivoAmbiente());
  if (ambiente) {
    console.log(`[OK] AmbienteId = "${ambiente}"`);
  } else {
    console.log('[FALLO] No se obtuvo AmbienteId. Revisar ADMIN_DISP_* y la información del dispositivo.');
  }
  const ambienteId = ambiente || '';

  // 3) Backend REST de Parámetros
  titulo('3) BACKEND REST (ApiKey = token de dispositivo)');
  const tk = token.TokenGen(APP_ID + MODO);
  console.log(tk ? `[OK] TokenGen len=${tk.length}` : '[WARN] TokenGen vacío');

  const defOut = await paso('GetParametroDefinicion', () => consumo.getParametroDefinicion({ aplicacionIdl: APP_ID, modo: MODO }));
  if (defOut) console.log(`   Ok=${defOut.Ok} · definiciones=${defOut.ParametrosDefinitionApp?.ParametrosItemDefinitionApp?.length ?? 0}`);

  const estOut = await paso('GetDefinicionEstructuras', () => consumo.getDefinicionEstructuras());
  if (estOut) console.log(`   Ok=${estOut.Ok} · estructuras=${estOut.SDTParametroEstructura?.length ?? 0}`);

  // Valores con el ambiente resuelto y el empKey indicado.
  const valOut = await paso(`GetParametrosValues (EmpKey=${EMPKEY}, Ambiente="${ambienteId}")`, () =>
    consumo.getParametrosValues({ empKey: EMPKEY, parametroId: '', alcanceId: ALCANCE, ambienteId, aplicacionIdl: APP_ID, modo: MODO }),
  );
  if (valOut) {
    const vals = valOut.ParametrosValuesApp?.ParametroValueArray ?? [];
    const conValor = vals.filter((v) => (v.ValorParametroValor ?? '') !== '').length;
    console.log(`   Ok=${valOut.Ok} · valores=${vals.length} · con valor no vacío=${conValor}`);
  }

  // 4) Inicializa + GetParametro (usa internamente el ambiente de dispositivos)
  titulo('4) InicializaParametrosNegocio + GetParametro');
  const okNeg = await paso('InicializaParametrosNegocio', () => parametros.InicializaParametrosNegocio(APP_ID, EMPKEY, ALCANCE, MODO));
  console.log(`   resultado=${okNeg}`);

  if (PARAMETRO) {
    const valor = await paso(`GetParametro("${PARAMETRO}")`, () =>
      parametros.GetParametro(PARAMETRO, { aplicacionId: APP_ID, empKey: EMPKEY, alcanceId: ALCANCE, ambienteId, modo: MODO }),
    );
    console.log(`   valor="${valor}"`);
  } else {
    console.log('   (define <parametro> para probar GetParametro)');
  }

  await app.close();
  console.log('\nFin de la prueba.');
  process.exit(0);
}

main().catch((e) => {
  console.error('FATAL:', detalleError(e));
  process.exit(1);
});
