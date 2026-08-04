/* Utilidades de test: fakes en memoria de las dependencias de ParametrosService. */
import type { ParametroDefinicion, ParametroValueItem } from '../src/interfaces';

interface Entrada {
  valor: unknown;
  mtime: number;
  expiraMs?: number;
}

/** Persistencia fake en memoria (implementa lo que usa ParametrosService). */
export class FakePersistencia {
  readonly store = new Map<string, Entrada>();
  getCalls = 0;

  private k(repo: string, llave: string): string {
    return `${repo}:${llave}`;
  }
  private vivo(e: Entrada | undefined): e is Entrada {
    return !!e && (e.expiraMs === undefined || e.expiraMs > Date.now());
  }

  async set(repo: string, llave: string, valor: unknown): Promise<boolean> {
    this.store.set(this.k(repo, llave), { valor, mtime: Date.now() });
    return true;
  }
  async get<T = unknown>(repo: string, llave: string): Promise<T | null> {
    this.getCalls++;
    const e = this.store.get(this.k(repo, llave));
    return this.vivo(e) ? (e.valor as T) : null;
  }
  async check(repo: string, llave: string): Promise<{ ok: boolean; ultimaModificacion: Date | null }> {
    const e = this.store.get(this.k(repo, llave));
    return this.vivo(e)
      ? { ok: true, ultimaModificacion: new Date(e.mtime) }
      : { ok: false, ultimaModificacion: null };
  }
  readonly repositorio = {
    existe: async (llave: string, repo: string): Promise<boolean> => this.vivo(this.store.get(this.k(repo, llave))),
    guardar: async (
      llave: string,
      repo: string,
      valor: unknown,
      opciones?: { ttlSegundos?: number },
    ): Promise<boolean> => {
      this.store.set(this.k(repo, llave), {
        valor,
        mtime: Date.now(),
        expiraMs: opciones?.ttlSegundos ? Date.now() + opciones.ttlSegundos * 1000 : undefined,
      });
      return true;
    },
    eliminar: async (llave: string, repo: string): Promise<boolean> => this.store.delete(this.k(repo, llave)),
    obtener: async () => null,
    existeRepo: async () => false,
    listar: async () => [],
    eliminarRepositorio: async () => 0,
  };
}

/** DispositivoService fake. */
export function fakeDispositivo(over: Partial<{ id: string; ambiente: string }> = {}) {
  return {
    GetDispositivoId: jest.fn(() => over.id ?? 'DEV1'),
    GetDispositivoClave: jest.fn(() => 'CLAVE'),
    GetDispositivoAmbiente: jest.fn(async () => over.ambiente ?? 'QA'),
  } as any;
}

/** ConsumoParametrosService fake (jest.fn por operación). */
export function fakeConsumo(data: {
  definiciones?: ParametroDefinicion[];
  estructuras?: any[];
  valores?: ParametroValueItem[];
} = {}) {
  return {
    getParametroDefinicion: jest.fn(async () => ({
      ParametrosDefinitionApp: { ParametrosItemDefinitionApp: data.definiciones ?? [] },
      Ok: true,
    })),
    getDefinicionEstructuras: jest.fn(async () => ({
      SDTParametroEstructura: data.estructuras ?? [],
      Ok: true,
    })),
    getParametrosValues: jest.fn(async () => ({
      ParametrosValuesApp: { ParametroValueArray: data.valores ?? [] },
      Ok: true,
    })),
  } as any;
}

/** ConfigService fake con un mapa de variables. */
export function fakeConfig(vars: Record<string, string | number> = {}) {
  return { get: (k: string) => vars[k] } as any;
}

/** Item de valor con ventana abierta por defecto (centinela "0000"). */
export function valor(
  ParametroId: string,
  ValorParametroValor: string,
  extra: Partial<ParametroValueItem> = {},
): ParametroValueItem {
  return {
    ParametroId,
    ValorParametroValor,
    ValorParametroIni: '0000-00-00T00:00:00',
    ValorParametroFin: '2090-12-31T23:59:00',
    ...extra,
  };
}

export function definicion(
  ParametroId: string,
  extra: Partial<ParametroDefinicion> = {},
): ParametroDefinicion {
  return { ParametroId, TipoDefinicionId: 'Neg', ParametroMaxAlcance: '1', Separador: '', ...extra };
}
