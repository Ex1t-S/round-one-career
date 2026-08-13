# ROUND/ONE

Simulador offline-first de carrera profesional de Counter-Strike para web, Android e iOS. El jugador empieza como una promesa desconocida, toma decisiones con memoria, compite durante hasta 12 temporadas y puede terminar como leyenda, IGL, coach, analista, creador o retirado.

## Estado del producto

La versión actual incluye:

- Creación de jugador con identidad, región, edad, rol, estilo, personalidad y prioridades.
- 29 atributos conectados al rendimiento, la progresión, los contratos y los eventos.
- Motor probabilístico determinista: atributos, rol, mapa, rival, ranking, forma, fatiga, química, presión y estado mental explican cada resultado.
- Estadísticas por mapa y serie: K/D, ADR, KAST, rating, aperturas, clutches 1vX, HS%, utility, trades, lados CT/T, pistolas, overtime y presión.
- 100 equipos del circuito global, múltiples regiones y niveles competitivos.
- 30 torneos por temporada, formatos BO1/BO3/BO5, clasificatorios, RMR y exactamente dos Majors.
- Ocho mapas configurables con modificadores por rol, lado y estilo.
- 210 eventos narrativos reutilizables con consecuencias combinadas y memoria persistente.
- Entrenamiento, fatiga, burnout, lesiones, motivación, química, transferencias, contratos, finanzas y rankings dinámicos.
- Tres enfoques tácticos opcionales antes de resolver un partido.
- Premios, trofeos, noticias, redes, rivalidades, retiro, Hall of Fame y resumen compartible.
- Creación de carrera más 24 vistas conectadas mediante Expo Router.
- Guardado automático local, importación/exportación JSON, reinicio con confirmación y funcionamiento sin conexión.
- Diseño responsive tipo HUD esports para móvil, tablet y escritorio.

## Phase 2

La segunda etapa convierte cada Major en una campaña persistente. El camino configurable incluye invitaciones por ranking, clasificatorios, RMR, dos etapas Swiss, playoffs de ocho equipos, ceremonia, MVP, all-star team y consecuencias sobre ranking, reputación, contratos y valor de mercado. Tres victorias clasifican y tres derrotas eliminan; los deciders usan BO3 y la gran final puede usar BO5.

Diez minijuegos opcionales aportan modificadores moderados a las series: clutch 1vX, map veto, compra de ronda, timeout táctico, retake/save, timing de peek, utility memory, lectura de minimapa, spray control y overtime decision. Pueden configurarse por frecuencia y dificultad, o simularse automáticamente.

Cada temporada termina ahora en `OFF-SEASON — BALANCE & UPGRADES`. La fase bloquea el año siguiente hasta revisar resultados, ingresos, impuestos, gastos, contrato, compras, inversiones, descanso y objetivos. El catálogo incluye 76 mejoras con requisitos, niveles, mantenimiento, reventa, riesgo y diminishing returns. Propiedades, inversiones, cash y valor de reventa forman el patrimonio de carrera.

Career Analytics agrega gráficos SVG responsive para rendimiento, atributos, mapas, lados CT/T, opening duels, forma, finanzas, salarios, valor de mercado y patrimonio. Los fondos editoriales, banners, avatares, escudos y trofeos son assets locales originales; la aplicación no depende de URLs externas.

## Datos

La seed de equipos usa como referencia el [Valve Regional Standings global del 3 de agosto de 2026](https://github.com/ValveSoftware/counter-strike_regional_standings/blob/main/live/2026/standings_global_2026_08_03.md). Ranking, puntos, nombres y rosters se transcribieron de esa publicación pública. Presupuestos, salarios, culturas, niveles de staff, colores y otras variables propias del juego son aproximaciones configurables y no datos oficiales.

Los calendarios, premios y formatos son modelos de simulación editables. La aplicación no descarga logos, fotos de jugadores ni datos externos durante la ejecución. Los nombres comerciales pertenecen a sus respectivos titulares.

## Requisitos

- Node.js 22.13 o superior.
- npm 10 o superior.
- Expo Go o un development build para probar en un dispositivo.
- Android Studio para emulador Android local.
- macOS con Xcode para simulador iOS local; desde Windows se puede usar un iPhone físico o EAS Build.

## Instalación y ejecución

```bash
npm install
npm run start
```

Web:

```bash
npm run web
```

Android:

```bash
npm run android
```

iOS:

```bash
npm run ios
```

Export web estático:

```bash
npm run build:web
```

El resultado queda en `dist/` y contiene rutas estáticas para todas las pantallas.

## Validaciones

```bash
npm run typecheck
npm run lint
npm run test:data
npm run validate
npm run build:web
```

`test:data` verifica invariantes del contenido y ejecuta automáticamente una carrera completa de 12 temporadas. Controla cantidades mínimas, IDs únicos, dos Majors, rangos de atributos, estadísticas finitas, ausencia de `NaN`, partidos, decisiones y un final válido.

## Arquitectura

```text
src/
  app/                    rutas Expo Router
  components/             HUD, layout y componentes reutilizables
  constants/              tema y catálogo de rutas
  data/                   seeds locales y adaptador de datos
  engine/                 simulación, Majors, Swiss, brackets, minijuegos, economía y progresión
  screens/                creación y vistas del producto
  state/                  store, persistencia y acciones de carrera
  types/                  modelo TypeScript del dominio
  utils/                  utilidades portables
scripts/
  validate-game.ts        simulación e invariantes end-to-end
```

La lógica principal vive en funciones puras. Las pantallas consumen el store y no contienen el motor de simulación.

## Agregar o modificar contenido

### Equipos

Editar `src/data/teams.ts`. Cada equipo necesita identidad, región, tier, ranking, presupuesto, roster, roles, staff, cultura, map pool, objetivos y variables de mercado. Mantener un `id` único.

### Torneos

Editar `src/data/tournaments.ts`. Definir mes, semana, tier, región, premio, formato, equipos, map pool, prestigio, presión, puntos y requisitos. La constante `MAJORS` debe seguir devolviendo exactamente dos eventos por temporada.

### Mapas

Editar `src/data/maps.ts`. Los modificadores alteran el score del rol y los ratings CT/T; un mapa legacy puede quedar cargado con `active: false`.

### Eventos y decisiones

Editar `src/data/events.ts`. Un evento puede modificar varios atributos, relaciones, dinero, forma, fatiga, burnout, reputación, fanbase y flags de memoria. Las plantillas generan variaciones por contexto sin duplicar lógica.

### Estadísticas y balance

- `src/engine/simulation.ts`: rendimiento, probabilidad de victoria y box score.
- `src/engine/progression.ts`: XP, niveles, entrenamiento, fatiga, química y valor de mercado.
- `src/engine/season.ts`: calendario, selección de eventos, partidos y finales.
- `src/engine/ranking.ts`: actualización de posiciones y ranking del jugador.
- `src/engine/contracts.ts`: salarios, finanzas y negociación.

Después de cambiar balance o contenido, ejecutar `npm run validate`.

## Persistencia

La carrera se guarda con AsyncStorage bajo el esquema versionado v2. Los guardados v1 se validan y migran automáticamente, incluyendo defaults para Majors, finanzas, inventario, récords y opciones visuales. En web utiliza el almacenamiento local compatible; en Android e iOS usa el backend nativo de AsyncStorage. La pantalla Configuración permite:

- Activar o desactivar autosave.
- Importar una carrera JSON validada.
- Exportar el estado completo.
- Compartir un resumen de texto.
- Borrar la carrera con una confirmación explícita.

## Conectar una API futura

`src/data/source.ts` define `GameDataAdapter` y mantiene `localDataAdapter` como fallback offline. Una integración remota debe:

1. Implementar `load()` con el mismo `GameDataSnapshot`.
2. Validar y versionar la respuesta antes de incorporarla al store.
3. Conservar la seed local para el primer inicio y los errores de red.
4. Separar datos oficiales de campos aproximados o editoriales.
5. Agregar migraciones al incrementar `schemaVersion`.

La misma frontera permite sumar cuentas, sincronización cloud, ligas compartidas o multijugador sin reemplazar los motores locales.

## Próximas versiones

- Árboles completos de torneo con múltiples series, clasificación y eliminación real por etapa.
- Mercado autónomo global con fichajes, préstamos, banca, academias, retiros y organizaciones que aparecen o desaparecen.
- Minijuegos interactivos de clutch, spray, utility, minimapa, compras y timeout.
- Roster global de jugadores simulados con historial individual y desarrollo por edad.
- Negociación contractual por turnos, representantes, impuestos por país y buyouts dinámicos.
- Más cadenas narrativas, rivalidades persistentes y eventos posteriores al retiro.
- Sincronización cloud, perfiles, telemetría de balance y carreras compartidas.
- Assets de marca y escudos propios listos para producción.
