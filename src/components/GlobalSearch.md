# GlobalSearch

**Ruta:** `src/components/GlobalSearch.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Permite buscar tags, canales, temas y respuestas desde el header. Convierte una consulta corta en accesos rapidos a resultados relevantes.

Para contexto global del sistema, ver [CODEX.md](../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
- `query`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `results`: estado local inicializado con `[]`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `loading`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `open`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `inputRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `containerRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `debounceRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.

## Datos
- Origen: React Router, channels, tags, topics.
- Tabla(s): channels, tags, topics.
- RLS: ⚠️ POR CONFIRMAR para estas tablas en remoto; el CLI 2.76.12 no expone `db execute/query` y `db dump` falló por `SUPABASE_DB_PASSWORD`. Ver auditoría en `CODEX.md`.
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: renderiza `Spinner`, estados `loading` o texto de carga según el flujo.
- Error: no muestra error propio detectado.
- Vacío: renderiza empty state cuando no hay datos.

## Dependencias
- `../services/supabase`
- `lucide-react`
- `react`
- `react-router-dom`

## Consumido por
- `src\layouts\MainLayout.tsx:19:import GlobalSearch from '../components/GlobalSearch'`
- `src\layouts\MainLayout.tsx:485:            <GlobalSearch />`
- `src\layouts\MainLayout.tsx:489:            <GlobalSearch />`

## Comportamiento
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Navega programáticamente después de acciones exitosas o al seleccionar resultados.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.
- Hay manejo de refs/foco o medición; mantener cleanup y orden de foco.

## Pendientes
- Pendiente: confirmar policies RLS remotas para las tablas consultadas antes de cambiar filtros o permisos.
