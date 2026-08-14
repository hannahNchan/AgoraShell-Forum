# NotificationPanel

**Ruta:** `src/features/notifications/components/NotificationPanel.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Muestra notificaciones del usuario, permite marcarlas como leidas y navega al contenido relacionado. Se actualiza en tiempo real cuando llegan nuevas notificaciones.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| `open` | `boolean` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `onClose` | `() => void` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |

## Estado interno
- `panelRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.

## Datos
- Origen: React Router, Redux store, hooks internos, notifications.
- Tabla(s): notifications.
- RLS: ⚠️ POR CONFIRMAR para estas tablas en remoto; el CLI 2.76.12 no expone `db execute/query` y `db dump` falló por `SUPABASE_DB_PASSWORD`. Ver auditoría en `CODEX.md`.
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: renderiza `Spinner`, estados `loading` o texto de carga según el flujo.
- Error: no muestra error propio detectado.
- Vacío: renderiza empty state cuando no hay datos.

## Dependencias
- `../../../components/shared/Spinner`
- `../../../services/supabase`
- `../../../store`
- `../../../types`
- `../../auth/hooks/useAuth`
- `../store/notificationsSlice`
- `date-fns`
- `date-fns/locale`
- `lucide-react`
- `react`
- `react-redux`
- `react-router-dom`

## Consumido por
- `src\layouts\MainLayout.tsx:20:import NotificationPanel from '../features/notifications/components/NotificationPanel'`
- `src\layouts\MainLayout.tsx:514:                <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />`

## Comportamiento
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Mantiene suscripción realtime y la limpia al desmontar.
- Navega programáticamente después de acciones exitosas o al seleccionar resultados.
- Usa Redux para disparar cambios globales y reflejar estados en otras partes de la app.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.
- Hay manejo de refs/foco o medición; mantener cleanup y orden de foco.
- Modales/overlays deben cerrar con botones visibles; no se detecta trap de foco generalizado salvo manejo local.

## Pendientes
- Pendiente: confirmar policies RLS remotas para las tablas consultadas antes de cambiar filtros o permisos.
