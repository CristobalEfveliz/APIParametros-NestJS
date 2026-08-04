import {
  zeroPad,
  contextId,
  tagDefinicion,
  tagEstructura,
  tagNotificacion,
  tagOffline,
  REPOSITORIO_PARAMETROS,
} from '../src/constants';

describe('constants', () => {
  test('zeroPad rellena a 6 con ceros', () => {
    expect(zeroPad(0)).toBe('000000');
    expect(zeroPad(9161)).toBe('009161');
    expect(zeroPad(1234567)).toBe('1234567'); // no trunca
  });

  test('contextId = App + zeroPad(EmpKey,6) + Alcance', () => {
    expect(contextId('ServidorPOS', 9101, 'DEV1')).toBe('ServidorPOS009101DEV1');
    expect(contextId('App', 0, '')).toBe('App000000');
  });

  test('tags de llaves', () => {
    expect(tagDefinicion('X')).toBe('DefinicionX');
    expect(tagEstructura('E1')).toBe('EstructuraE1');
    expect(tagOffline('Valores_App')).toBe('Offline_Valores_App');
  });

  test('tagNotificacion usa EmpKey SIN ceros a la izquierda', () => {
    expect(tagNotificacion('App', 9101, 'DEV1')).toBe('NotificaActualizacion_App_9101_DEV1');
  });

  test('repositorio constante', () => {
    expect(REPOSITORIO_PARAMETROS).toBe('Parametros2410');
  });
});
