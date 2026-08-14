# HomePage

**Ruta:** `src/features/forums/pages/HomePage.tsx`
**Tipo:** página
**Estado:** estable

## Qué hace
Muestra el feed principal de temas con filtros de orden y scroll infinito. Es la entrada de descubrimiento de conversaciones.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
- `filtersVisible`: estado local inicializado con `true`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `loaderRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `pageRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `loadingMoreRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `hasMoreRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `loadingRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `lastScrollY`: referencia DOM/imperativa para foco, medición, timers o cleanup.

## Datos
- Origen: Redux store, topic_stars, topics.
- Tabla(s): topic_stars, topics.
- RLS: ⚠️ POR CONFIRMAR para estas tablas en remoto; el CLI 2.76.12 no expone `db execute/query` y `db dump` falló por `SUPABASE_DB_PASSWORD`. Ver auditoría en `CODEX.md`.
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: renderiza `Spinner`, estados `loading` o texto de carga según el flujo.
- Error: muestra mensajes locales, errores de store o fallback según el componente.
- Vacío: renderiza empty state cuando no hay datos.

## Dependencias
- `../../../components/shared/Spinner`
- `../../../store`
- `../components/FeedTopicCard`
- `../components/HotTopicCard`
- `../hooks/useHotTopics`
- `../store/feedSlice`
- `lucide-react`
- `react`
- `react-redux`
- `react-router-dom`

## Consumido por
- Ruta: `/` en `src/routes/index.tsx`.

## Comportamiento
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Usa Redux para disparar cambios globales y reflejar estados en otras partes de la app.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Hay manejo de refs/foco o medición; mantener cleanup y orden de foco.

## Pendientes
- Sin TODOs visibles en el archivo; mantener sincronizado con cambios de código.
