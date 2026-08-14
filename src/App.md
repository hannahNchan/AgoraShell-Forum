# App

**Ruta:** `src/App.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Inicializa la aplicacion, carga la sesion del usuario y mantiene sincronizado el estado de autenticacion. Es el puente entre Supabase Auth y el router principal.

Para contexto global del sistema, ver [CODEX.md](../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
No guarda estado interno propio; depende de props, store, router o hooks externos.

## Datos
- Origen: Redux store.
- Tabla(s): no consulta tablas Supabase directamente.
- RLS: no aplica directamente porque no consulta Supabase.
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: no maneja estado de carga propio detectado.
- Error: no muestra error propio detectado.
- Vacío: no se detectó empty state dedicado.

## Dependencias
- `./features/auth/store/authSlice`
- `./routes`
- `./services/supabase`
- `./store`
- `react`
- `react-redux`

## Consumido por
- Consumido por `src/main.tsx`.

## Comportamiento
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Usa Redux para disparar cambios globales y reflejar estados en otras partes de la app.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.

## Pendientes
- Pendiente: confirmar policies RLS remotas para las tablas consultadas antes de cambiar filtros o permisos.
