# ProtectedRoute

**Ruta:** `src/components/shared/ProtectedRoute.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Restringe una vista a usuarios autenticados y opcionalmente a usuarios con permiso administrativo. Actualmente existe como utilidad de proteccion reutilizable.

Para contexto global del sistema, ver [CODEX.md](../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| `children` | `React.ReactNode` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `requireAdmin` | `boolean` | No | N/A | Ver uso en el componente; no hay documentación inline adicional. |

## Estado interno
No guarda estado interno propio; depende de props, store, router o hooks externos.

## Datos
- Origen: React Router, hooks internos.
- Tabla(s): no consulta tablas Supabase directamente.
- RLS: no aplica directamente porque no consulta Supabase.
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: renderiza `Spinner`, estados `loading` o texto de carga según el flujo.
- Error: no muestra error propio detectado.
- Vacío: no se detectó empty state dedicado.

## Dependencias
- `../../features/auth/hooks/useAuth`
- `../../features/auth/hooks/useRole`
- `./Spinner`
- `react-router-dom`

## Consumido por
- ⚠️ POR CONFIRMAR: no se detectó consumidor directo con búsqueda textual.

## Comportamiento
- Renderiza contenido según props y delega interacciones al padre.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.

## Pendientes
- Deuda: existe pero no está conectado en `src/routes/index.tsx`.
