# @andestec/api-parametros

API de Parámetros como **librería NestJS** de servicios inyectables (sin controladores HTTP),
port del cliente GeneXus 18 (Java). Caché **solo en Redis** vía
[`@andestec/persistencia-redis`](https://github.com/CristobalEfveliz/persistencia-redis) y
autenticación vía [`@andestec/api-dispositivos`](https://github.com/CristobalEfveliz/APIDispositivo-NestJS).
Consume el backend REST `ObtencionParametros`.

## Arquitectura

```
        ┌─────────────────────┐
        │   app anfitriona     │  importa ParametrosModule
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐     REST (ApiKey = token dispositivo)
        │  @andestec/         │────────────────────────────────►  Backend
        │  api-parametros     │                                   ObtencionParametros
        └───┬─────────────┬───┘
            │ importa     │ importa
   ┌────────▼──────┐ ┌────▼────────────────┐
   │ api-          │ │ persistencia-redis  │──►  Redis (caché de parámetros)
   │ dispositivos  │ └─────────────────────┘
   │ (id + token + │
   │  ambiente)    │
   └───────────────┘
```

El backend **resuelve la jerarquía** (aplicación / empresa / dispositivo) según el
`(EmpKey, Alcance)` de la consulta y devuelve el valor efectivo. Esta librería lo
cachea en Redis indexado por el contexto completo `contextId(App, EmpKey, Alcance)`.

## Instalación

```bash
npm install
npm run build
```

Requiere un Redis accesible y las variables de entorno (ver [`.env.example`](.env.example)).

## Uso

```ts
import { Module } from '@nestjs/common';
import { ParametrosModule } from '@andestec/api-parametros';

@Module({ imports: [ParametrosModule] })
export class AppModule {}
```

```ts
import { ParametrosService } from '@andestec/api-parametros';

constructor(private readonly parametros: ParametrosService) {}

// Refrescar (baja definición + estructuras + valores a Redis si toca)
await this.parametros.InicializaParametrosNegocio('MiApp', 123, 'ALC-01', '');
await this.parametros.InicializaParametrosDispositivo('MiApp', 123, '');

// Leer un valor
const valor = await this.parametros.GetParametro('MI_PARAMETRO', {
  aplicacionId: 'MiApp',
  empKey: 123,
  alcanceId: 'ALC-01',
});

// Valor compuesto: sufijo por índice (1-based)
const componente = await this.parametros.GetParametro('MI_PARAM_2', { empKey: 123 });

// Forzar refresco desde un webhook (invalidación por notificación push)
await this.parametros.notificarRefresco('MiApp', 123, dispositivoId);
```

## API pública (`ParametrosService`)

| Método | Descripción |
|---|---|
| `GetParametro(parametroId, contexto)` | Lee el valor vigente. Resuelve alcance por `TipoDefinicionId` (`Neg`→negocio, `Disp`→dispositivo). Soporta sufijo compuesto `base_indice`. |
| `InicializaParametrosDispositivo(appId, empKey, modo)` | Refresca los parámetros con alcance = id del dispositivo. |
| `InicializaParametrosNegocio(appId, empKey, alcanceId, modo)` | Refresca los parámetros con alcance de negocio provisto. |
| `notificarRefresco(appId, empKey, alcanceId)` | Marca un scope para refresco (lo llama el host al recibir un push del servidor central). |

`GetParametro` recibe un **contexto explícito** `{ aplicacionId, empKey, alcanceId, ambienteId, modo }`
(los campos omitidos toman defaults del entorno). No usa estado global mutable.

## Autenticación (header `ApiKey`)

El token M2406 se genera con `@andestec/api-dispositivos` (`TokenService.TokenGen`). Su
`strControl` se arma con los MISMOS valores enviados en la query (trim + orden), porque el
backend recomputa el token para validarlo:

| Operación | `strControl` |
|---|---|
| `GetParametrosValues` | `EmpKey + ParametroId + AlcanceId + AmbienteId + Aplicacion_Idl + Modo` |
| `GetParametroDefinicion` | `Aplicacion_Idl + Modo` |
| `GetDefinicionEstructuras` | *(sin strControl → `TokenGen("")`)* |

El `AmbienteId` se obtiene de `@andestec/api-dispositivos` (`GetDispositivoAmbiente`).

## Modelo en Redis (repositorio `Parametros2410`)

- **Valores** — `Parametros2410:<contextId>` → `ParametroValueItem[]`
- **Definición** — `Parametros2410:Definicion<ParametroId>`
- **Estructura** — `Parametros2410:Estructura<EstructuraId>`
- **Vigencia** — `Parametros2410:Vigencia<contextId>` → epoch ms
- **Notificación** — `Parametros2410:NotificaActualizacion_<App>_<EmpKey>_<Alcance>`
- **Breaker** — `Parametros2410:Offline_<servicio>` (con TTL)
- `contextId = AplicacionId + zeroPad(EmpKey,6) + AlcanceId`

## Frescura, caché y resiliencia

- **Vigencia** (`PARAM_VIGENCIA_MS`, default 5 min): `Inicializa*` solo re-descarga si la
  persistencia del scope venció, si `Modo="WebApp"`, o si hubo notificación.
- **Caché en proceso**: memo de valores (incluye "miss" cacheado) y de definiciones
  (negativo `NoExiste`), acotado a la ventana de frescura y limpiado en cada refresco.
- **Invalidación por notificación push**: `notificarRefresco(...)` marca el scope en Redis;
  la siguiente `Inicializa*` lo detecta y fuerza el refresco (cross-instancia).
- **Circuit-breaker offline** (`PARAM_BREAKER_NET_S`, default 300 s): ante error de red, el
  servicio se marca offline y las siguientes llamadas se omiten (se usa la caché) hasta que
  expire. Además un throttle de definiciones (`PARAM_DEF_THROTTLE_S`, default 180 s).

## Configuración (`.env`)

Ver [`.env.example`](.env.example). Un único `.env` sirve a las tres librerías (no se
duplican variables): `REDIS_*` las lee persistencia-redis; `DISPOSITIVO_*` / `ADMIN_DISP_*`
las lee api-dispositivos; `PARAM_*` las lee esta librería.

## Scripts de prueba

En `scripts/` (requieren `.env` y Redis):

| Script | Qué prueba |
|---|---|
| `prueba-parametros.js <empKey> [alcance] [param] [modo]` | Flujo completo: ambiente, auth, Inicializa, GetParametro |
| `test-jerarquia.js` | Resolución por jerarquía (aplicación/empresa/dispositivo) |
| `test-compuestos.js` | Valores compuestos por índice |
| `test-cache-miss.js` | Caché positiva y negativa (NoExiste) |
| `test-notificacion.js` | Invalidación por notificación push |
| `test-breaker.js` | Circuit-breaker offline |

## Estado / pendientes

Portadas y validadas contra backend real: `GetParametro`, `InicializaParametros*`,
jerarquía, valores compuestos por índice, ambiente, auth, caché de miss, notificación push
y circuit-breaker. Pendiente: sufijo compuesto por **nombre** de componente (vía Estructura),
operaciones de escritura (`SetParametrosValues`, réplicas) y tests automatizados.

## Licencia

Restringido (`publishConfig.access: restricted`).
