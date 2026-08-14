# AuthCallbackPage

**Ruta:** `src/features/auth/pages/AuthCallbackPage.tsx`
**Tipo:** página
**Estado:** estable

## Qué hace
Procesa el retorno de Supabase Auth. Si hay sesion, redirige al home; si falla, devuelve al login con error.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
No guarda estado interno propio; depende de props, store, router o hooks externos.

## Datos
- Origen: React Router.
- Tabla(s): no consulta tablas Supabase directamente.
- RLS: no aplica directamente porque no consulta Supabase.
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: renderiza `Spinner`, estados `loading` o texto de carga según el flujo.
- Error: muestra mensajes locales, errores de store o fallback según el componente.
- Vacío: no se detectó empty state dedicado.

## Dependencias
- `../../../components/shared/Spinner`
- `../../../services/supabase`
- `react`
- `react-router-dom`

## Consumido por
- Ruta: `/auth/callback` en `src/routes/index.tsx`.

## Comportamiento
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Navega programáticamente después de acciones exitosas o al seleccionar resultados.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.

## Pendientes
- Pendiente: confirmar policies RLS remotas para las tablas consultadas antes de cambiar filtros o permisos.
