# ReportsAdminPanel

**Ruta:** `src/features/reports/components/ReportsAdminPanel.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Panel operativo de reportes para reclamar, soltar, resolver o desestimar casos. Permite aplicar acciones moderativas y registrar notas.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
- `statusFilter`: estado local inicializado con `'open'`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `targetFilter`: estado local inicializado con `'all'`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `reasonFilter`: estado local inicializado con `'all'`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `query`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `activeNoteId`: estado local inicializado con `null`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `moderatorNote`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `penalty`: estado local inicializado con `'none'`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `moderationReasonId`: estado local inicializado con `MODERATION_REASONS[0].id`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `durationDays`: estado local inicializado con `7`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `deleteReply`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `resolveError`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `resolvingId`: estado local inicializado con `null`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.

## Datos
- Origen: Redux store, profiles, replies, reply_reactions, reports, topics.
- Tabla(s): profiles, replies, reply_reactions, reports, topics.
- RLS citada textual desde `supabase/migrations`; ver también `CODEX.md` para auditoría CLI.
Policy textual de insert para `replies`:
```sql
create policy "emergency_lock_replies_insert" on public.replies as restrictive for insert to authenticated with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role_id = 1) or not coalesce((select foro_bloqueado from public.app_settings where id = 1), false));
create policy "restrictions_replies_insert" on public.replies as restrictive for insert to authenticated with check (public.user_can_create_content(auth.uid()));
```
Policy textual para `reports`:
```sql
create policy "reports_insert_authenticated"
on public.reports
for insert
to authenticated
with check (reporter_id = auth.uid());

create policy "reports_select_owner_or_moderator"
on public.reports
for select
to authenticated
using (
  reporter_id = auth.uid()
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id in (1, 2)
  )
);

create policy "reports_update_moderator"
on public.reports
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id in (1, 2)
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id in (1, 2)
  )
);
```
Policy textual de insert para `topics`:
```sql
create policy "emergency_lock_topics_insert" on public.topics as restrictive for insert to authenticated with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role_id = 1) or not coalesce((select foro_bloqueado from public.app_settings where id = 1), false));
create policy "restrictions_topics_insert" on public.topics as restrictive for insert to authenticated with check (public.user_can_create_content(auth.uid()));
```
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: renderiza `Spinner`, estados `loading` o texto de carga según el flujo.
- Error: muestra mensajes locales, errores de store o fallback según el componente.
- Vacío: renderiza empty state cuando no hay datos.

## Dependencias
- `../../../components/shared/Spinner`
- `../../../store`
- `../../../types`
- `../constants/moderationCatalog`
- `../store/reportsSlice`
- `date-fns`
- `date-fns/locale`
- `react`
- `react-redux`
- `react-router-dom`

## Consumido por
- `src\features\auth\pages\AdminPage.tsx:10:import ReportsAdminPanel from '../../reports/components/ReportsAdminPanel'`
- `src\features\auth\pages\AdminPage.tsx:444:        <ReportsAdminPanel />`
- `src\features\auth\pages\AdminPage.tsx:454:      <ReportsAdminPanel />`

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
