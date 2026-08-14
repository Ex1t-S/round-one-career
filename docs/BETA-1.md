# ROUND/ONE Beta 1

## Incluye

- Loop completo de carrera hasta 12 temporadas, con decisiones, entrenamiento, lesiones, transferencias, contratos, Major, economía, activos y finales.
- Performance, Legacy y Finance Centers con aliases para las rutas antiguas.
- Match tactics temporales, ranking Top 100 con detalle, calendario con detalle de evento, TeamCrest local y ocho avatares ficticios.
- Migración de saves hasta schema v4, import/export validado y balance financiero reconciliado.

## Sistemas activos

Majors usan qualification/RMR, Swiss, bracket y ceremonia. Los minijuegos son opcionales y pueden simularse automáticamente. La economía liquida ingresos y gastos una vez al cierre anual; el `prizeShare` se interpreta como porcentaje (12 = 12%).

## Experimental / limitaciones conocidas

- Los equipos NPC y sus rosters son seeds de datos del juego; no son un feed online de HLTV.
- La validación responsive se ejecuta en Edge headless contra el export web; la comprobación visual final en dispositivos Android/iOS reales sigue siendo manual.
- El mercado global de prospects, academias profundas, social complejo y multiplayer siguen fuera del freeze de Beta 1.

## Ejecutar

```bash
npm install
npm run web
```

## Validar

```bash
npm run typecheck
npm run lint
npm run test:data
npm run validate
npm run simulate:10
npm run build:web
npx expo-doctor
```

La batería de cierre rápida se ejecuta con `npm run beta:check`. El soak estadístico completo queda separado en `npm run soak:beta`.

Para reportar un problema, usar `docs/beta-bug-report.md` e incluir seed y save exportado si es posible.
