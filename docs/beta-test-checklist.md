# ROUND/ONE Beta 1 · checklist manual

Usá una carrera nueva y anotá Pass/Fail/Notes en cada bloque. La build debe indicar el commit que se está probando.

| Área | Prueba | Expected | Pass/Fail | Notes |
|---|---|---|---|---|
| New Career | Crear jugador, elegir nombre, rol, estilo y avatar | La carrera abre en Inicio con equipo, crest y siguiente acción |  |  |
| New Career | Elegir cada uno de los ocho avatares | Las miniaturas son distinguibles y persisten al recargar |  |  |
| Career | Avanzar una semana | El dashboard explica la próxima acción y no duplica eventos |  |  |
| Career | Entrenamiento y descanso | Cambian atributos/fatiga dentro de sus límites y se puede continuar |  |  |
| Career | Decisión | Hay contexto, seis slots anuales, outcome y consecuencias visibles |  |  |
| Competition | Abrir calendario y seleccionar evento | Se muestran fecha, tier, formato, premio, elegibilidad y salida |  |  |
| Competition | Jugar torneo y abrir Match Center | Táctica temporal, rival, mapas, resultado y explicación son coherentes |  |  |
| Competition | Intentar un Major | Se puede quedar fuera o avanzar por sus etapas sin pantalla bloqueada |  |  |
| Organization | Abrir Team/Roster/Market | Crest local, ranking vivo y datos simulados están identificados |  |  |
| Organization | Transferirse y negociar | Oferta/contrato muestran cooldown y no se puede explotar el botón |  |  |
| Finance | Abrir Finance durante temporada | Cash, patrimonio y cash-flow son legibles sin exigir off-season |  |  |
| Finance | Comprar upgrade/consumible | Se descuenta una sola vez, se registra y rechaza fondos insuficientes |  |  |
| Finance | Cerrar temporada | Balance & Upgrades bloquea el año siguiente hasta completar pasos |  |  |
| Persistence | Guardar, recargar y continuar | Se conservan temporada, partido, Major, dinero y compras |  |  |
| Persistence | Exportar, resetear e importar | La carrera vuelve completa; JSON inválido muestra error recuperable |  |  |
| Mobile | 320/360/390/430 px | Home/Match/Career/Major/More, drawer y botones son accesibles |  |  |
| Desktop | 1024/1280/1440/1920 px | Sidebar, cards y tablas no cortan labels ni crean scroll inesperado |  |  |
| Endgame | Completar carrera | Aparece un final y Legacy conserva los hitos importantes |  |  |
