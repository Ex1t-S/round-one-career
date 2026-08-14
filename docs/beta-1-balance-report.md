# ROUND/ONE Beta 1 · balance report

## Referencia

- HEAD de inicio: `2d552ba6b679945a6def2161210b637a221feb13`
- Fecha de la muestra: 2026-08-13
- Soak: 500 carreras parciales y 250 carreras completas en modo `--fast`
- Campañas Major aisladas: 3.500 (500 por banda representativa)
- Las seeds son deterministas y derivadas de los índices de ejecución de los scripts; no modifican reglas ni resultados hardcodeados.

## Rendimiento del soak

La línea base de 20 carreras completas sin compactación tardó aproximadamente 318,5 s (0,063 carreras/s). El modo estadístico conservando las mismas reglas de gameplay tardó 55,3 s para la misma muestra (0,368 carreras/s), una mejora aproximada de 5,8×. El soak oficial tardó 680,6 s y procesó 4,41 temporadas/s y 119,63 partidos/s.

El modo `--fast` evita solamente trabajo que no afecta la simulación: retención de historiales secundarios de UI, snapshots redundantes y serializaciones intermedias. No cambia probabilidades ni balance.

## Reachability de finales

Los siete finales se validaron con estados dirigidos. La evaluación es determinista, informa reglas coincidentes y respeta esta prioridad:

1. Leyenda de los Majors.
2. Imperio más allá del servidor.
3. El líder continúa desde el banco.
4. Del servidor a la comunidad.
5. La mente detrás del juego.
6. Ícono del circuito.
7. Una carrera de sacrificio.

## Distribución de finales (250 carreras completas)

| Final | Cantidad | % | Rating mediano | Patrimonio mediano | Majors promedio | Trofeos promedio | Mejor ranking promedio |
|---|---:|---:|---:|---:|---:|---:|---:|
| Imperio más allá del servidor | 22 | 8,8% | 0,70 | $6.085.358 | 0,00 | 2,55 | 29,5 |
| Ícono del circuito | 16 | 6,4% | 0,74 | $7.570.056 | 0,06 | 6,38 | 12,0 |
| Una carrera de sacrificio | 88 | 35,2% | 0,74 | $1.575.375 | 0,00 | 0,28 | 83,0 |
| Del servidor a la comunidad | 56 | 22,4% | 0,79 | $302.443 | 0,00 | 1,18 | 72,0 |
| La mente detrás del juego | 39 | 15,6% | 0,83 | $211.742 | 0,00 | 0,31 | N/D |
| El líder continúa desde el banco | 29 | 11,6% | 0,85 | $202.673 | 0,00 | 0,45 | N/D |
| Leyenda de los Majors | 0 | 0,0% | N/D | N/D | N/D | N/D | N/D |

Ningún final supera el umbral de alarma del 80%. Leyenda de los Majors es alcanzable en el test dirigido, pero no apareció en esta muestra natural porque exige dos títulos Major.

Career paths al retiro: jugador 117, creator 62, coach 30, analyst 41.

## Funnel Major aislado (500 campañas por banda)

| Banda | Attempts | Qualified | Opening | Elimination | Playoffs | Semifinal | Final | Champion |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Rank 1 | 500 | 500 | 500 | 142 | 50 | 12 | 6 | 2 |
| Rank 5 | 500 | 500 | 500 | 140 | 39 | 14 | 9 | 5 |
| Rank 10 | 500 | 500 | 500 | 109 | 31 | 11 | 6 | 1 |
| Rank 20 | 500 | 189 | 189 | 35 | 6 | 4 | 0 | 0 |
| Rank 40 | 500 | 182 | 182 | 11 | 2 | 0 | 0 | 0 |
| Rank 70 | 500 | 97 | 97 | 1 | 0 | 0 | 0 | 0 |
| Rank 110 | 500 | 6 | 6 | 0 | 0 | 0 | 0 | 0 |

Las 3.500 campañas terminaron sin bloqueos. Los Top 10 llegan claramente más lejos; los underdogs conservan una posibilidad de clasificación sin obtener un acceso regalado.

Funnel observado dentro del soak completo:

| Ranking | Attempt | Qualified | Opening | Elimination | Playoffs | Semifinal | Final | Champion |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1–10 | 56 | 56 | 56 | 14 | 5 | 1 | 0 | 0 |
| 11–30 | 104 | 96 | 96 | 12 | 4 | 3 | 2 | 1 |
| 31–60 | 160 | 131 | 131 | 11 | 1 | 0 | 0 | 0 |
| 61–100 | 212 | 53 | 53 | 1 | 0 | 0 | 0 | 0 |
| 101+ | 468 | 14 | 14 | 1 | 0 | 0 | 0 | 0 |

## Volumen por temporada

| Métrica | P10 | P25 | Mediana | P75 | P90 | Máximo |
|---|---:|---:|---:|---:|---:|---:|
| Series | 17 | 21 | 26 | 33 | 40 | 60 |
| Mapas | 39 | 49 | 60 | 76 | 90 | 132 |

No se detectaron carreras runaway ni valores NaN/Infinity.

## Invariantes económicos

- `prizeShare = 12` representa 12%; $100.000 elegibles liquidan $12.000.
- Un premio se liquida una sola vez.
- Compras y mantenimiento descuentan efectivo una sola vez.
- Las inversiones mueven valor sin duplicar patrimonio.
- `openingCash + realIncome - realExpenses = closingCash` reconcilia sin diferencia.
- El patrimonio no cuenta el efectivo dos veces.

## Limitaciones conocidas

- La muestra natural de 250 carreras no produjo Leyenda de los Majors, aunque el final tiene reachability dirigida.
- El QA responsive automatizado cubre el export web; Android e iOS reales requieren la checklist manual.
- Rankings, rosters y datos de NPC son seeds internas del juego, no un feed online en vivo.
