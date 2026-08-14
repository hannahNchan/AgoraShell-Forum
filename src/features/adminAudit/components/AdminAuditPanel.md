# AdminAuditPanel

**Ruta:** `src/features/adminAudit/components/AdminAuditPanel.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Permite a admins/mods revisar eventos administrativos y filtrar por accion o texto. Sirve para auditar cambios sensibles de moderacion.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
- `query`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `actionFilter`: estado local inicializado con `'all'`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.

## Datos
- Origen: Redux store, admin_audit_logs.
- Tabla(s): admin_audit_logs.
- RLS citada textual desde `supabase/migrations`; ver también `CODEX.md` para auditoría CLI.
Policy textual para `admin_audit_logs`:
```sql
create policy "Admins and moderators can read audit logs"
on public.admin_audit_logs
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.role_id in (1, 2) or p.role in ('admin', 'moderator'))
  )
);

create policy "Admins and moderators can insert audit logs"
on public.admin_audit_logs
for insert
with check (
  actor_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.role_id in (1, 2) or p.role in ('admin', 'moderator'))
  )
);
```
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: renderiza `Spinner`, estados `loading` o texto de carga según el flujo.
- Error: muestra mensajes locales, errores de store o fallback según el componente.
- Vacío: renderiza empty state cuando no hay datos.

## Dependencias
- `../../../components/shared/Spinner`
- `../../../store`
- `../store/adminAuditSlice`
- `date-fns`
- `date-fns/locale`
- `lucide-react`
- `react`
- `react-redux`

## Consumido por
- `src\features\auth\pages\AdminPage.tsx:14:import AdminAuditPanel from '../../adminAudit/components/AdminAuditPanel'`
- `src\features\auth\pages\AdminPage.tsx:445:        <AdminAuditPanel />`
- `src\features\auth\pages\AdminPage.tsx:456:      <AdminAuditPanel />`

## Comportamiento
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Usa Redux para disparar cambios globales y reflejar estados en otras partes de la app.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.

## Pendientes
- Sin TODOs visibles en el archivo; mantener sincronizado con cambios de código.
