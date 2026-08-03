/* eslint-disable no-console */
/**
 * Diagnóstico de JERARQUÍA para un parámetro (default DIRSEND).
 * Vuelca las filas crudas que devuelve el backend en distintos contextos,
 * para entender cómo se representan los niveles (aplicación/empresa/dispositivo)
 * antes de implementar la resolución por jerarquía.
 *
 *   node scripts/diag-jerarquia.js [PARAM] [empKeyEmpresa]
 *   node scripts/diag-jerarquia.js DIRSEND 9101
 */
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ParametrosModule, ConsumoParametrosService } = require('../dist');
const { DispositivoService } = require('@andestec/api-dispositivos');

const PARAM = process.argv[2] || process.env.PARAM || 'DIRSEND';
const EMP = Number(process.argv[3] || process.env.EMPKEY_EMPRESA || 9101);
const APP_ID = process.env.PARAM_APLICACION_ID || 'Cobru';
const MODO = process.env.PARAM_MODO || '';

function fila(it) {
  return {
    ValorParametroValor: it.ValorParametroValor,
    ValorJerarquia: it.ValorJerarquia,
    ParametroJerarquia: it.ParametroJerarquia,
    Ini: it.ValorParametroIni,
    Fin: it.ValorParametroFin,
    ValorInstanciado: it.ValorInstanciado,
  };
}

async function main() {
  const app = await NestFactory.createApplicationContext(ParametrosModule, { logger: ['error'] });
  const consumo = app.get(ConsumoParametrosService);
  const dispositivo = app.get(DispositivoService);

  const ambienteId = (await dispositivo.GetDispositivoAmbiente()) || '';
  const deviceId = dispositivo.GetDispositivoId() || '';
  console.log(`PARAM=${PARAM} · App=${APP_ID} · Ambiente=${ambienteId} · Device=${deviceId}\n`);

  // Definición del parámetro (MaxAlcance / TipoDefinicion)
  const defOut = await consumo.getParametroDefinicion({ aplicacionIdl: APP_ID, modo: MODO });
  const def = (defOut.ParametrosDefinitionApp?.ParametrosItemDefinitionApp ?? []).find((d) => d.ParametroId === PARAM);
  console.log('DEFINICIÓN:', def
    ? { MaxAlcance: def.ParametroMaxAlcance, TipoDefinicionId: def.TipoDefinicionId, Separador: def.Separador }
    : '(no aparece en la definición)');

  const contextos = [
    { etiqueta: 'aplicación (EmpKey=0, alcance="")', empKey: 0, alcanceId: '' },
    { etiqueta: `empresa   (EmpKey=${EMP}, alcance="")`, empKey: EMP, alcanceId: '' },
    { etiqueta: `empresa+device (EmpKey=${EMP}, alcance="${deviceId}")`, empKey: EMP, alcanceId: deviceId },
  ];

  for (const c of contextos) {
    console.log('\n' + '='.repeat(62) + `\n${c.etiqueta}\n` + '='.repeat(62));
    try {
      const out = await consumo.getParametrosValues({
        empKey: c.empKey,
        parametroId: PARAM,
        alcanceId: c.alcanceId,
        ambienteId,
        aplicacionIdl: APP_ID,
        modo: MODO,
      });
      const rows = (out.ParametrosValuesApp?.ParametroValueArray ?? []).filter((r) => r.ParametroId === PARAM);
      console.log(`Ok=${out.Ok} · filas de ${PARAM}=${rows.length}`);
      rows.forEach((r, i) => console.log(`  [${i}]`, JSON.stringify(fila(r))));
      if (out.Messages?.length) console.log('  Messages:', JSON.stringify(out.Messages).slice(0, 200));
    } catch (e) {
      console.log('  ERROR:', e.response ? `HTTP ${e.response.status}` : e.message);
    }
  }

  await app.close();
  process.exit(0);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
