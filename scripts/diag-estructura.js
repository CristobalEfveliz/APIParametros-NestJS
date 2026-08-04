/* eslint-disable no-console */
/** Diagnóstico de estructuras: cruza definiciones compuestas (con Separador) con
 *  su estructura (por TipoParametroID) y un valor real, para fijar la resolución
 *  del sufijo por NOMBRE. */
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ParametrosModule, ConsumoParametrosService } = require('../dist');
const { DispositivoService } = require('@andestec/api-dispositivos');

const APP = process.env.PARAM_APLICACION_ID || 'ServidorPOS';
const EMP = Number(process.env.EMPKEY || 9101);

async function main() {
  const app = await NestFactory.createApplicationContext(ParametrosModule, { logger: ['error'] });
  const consumo = app.get(ConsumoParametrosService);
  const dispositivo = app.get(DispositivoService);
  const ambienteId = (await dispositivo.GetDispositivoAmbiente()) || '';
  const device = dispositivo.GetDispositivoId() || '';

  const defOut = await consumo.getParametroDefinicion({ aplicacionIdl: APP, modo: '' });
  const defs = defOut.ParametrosDefinitionApp?.ParametrosItemDefinitionApp ?? [];
  const estOut = await consumo.getDefinicionEstructuras();
  const estructuras = estOut.SDTParametroEstructura ?? [];
  const estById = new Map(estructuras.map((e) => [e.ParametroEstructuraId, e]));

  const valOut = await consumo.getParametrosValues({
    empKey: EMP, parametroId: '', alcanceId: device, ambienteId, aplicacionIdl: APP, modo: '',
  });
  const valById = new Map((valOut.ParametrosValuesApp?.ParametroValueArray ?? []).map((v) => [v.ParametroId, v.ValorParametroValor]));

  console.log(`App=${APP} · defs=${defs.length} · estructuras=${estructuras.length}\n`);
  console.log('=== IDs de estructuras disponibles ===');
  console.log(estructuras.map((e) => e.ParametroEstructuraId).join(', '));

  const compuestas = defs
    .filter((d) => (d.Separador ?? '') !== '')
    .filter((d) => estById.has(d.TipoParametroID) && (valById.get(d.ParametroId) ?? '') !== '');
  console.log(`\n=== Compuestas CON valor y CON estructura : ${compuestas.length} ===`);
  for (const d of compuestas.slice(0, 12)) {
    const est = estById.get(d.TipoParametroID);
    const val = valById.get(d.ParametroId);
    console.log(`\n• ${d.ParametroId}  Tipo=${d.TipoParametroID}  Sep=${JSON.stringify(d.Separador)}  SepIniFin=${d.TipoParametroSeparadorInicioFin}`);
    console.log(`  valor = ${JSON.stringify(val)}`);
    if (est) {
      const comps = (est.Componente ?? []).map((c, i) => `[pos${i + 1}] id=${c.ParametroEstructuraComponenteId} orden=${c.ParametroEstructuraComponenteOrden}`);
      console.log(`  estructura(${d.TipoParametroID}).Componente: ${comps.join(' | ')}`);
      if (val && d.Separador) {
        console.log(`  split literal por "${d.Separador}" = ${JSON.stringify(String(val).split(d.Separador))}`);
      }
    } else {
      console.log(`  (sin estructura para Tipo=${d.TipoParametroID})`);
    }
  }

  await app.close();
  process.exit(0);
}
main().catch((e) => { console.error('FATAL', e.response ? `HTTP ${e.response.status}` : e.message); process.exit(1); });
