# ReportModal

**Ruta:** `src/features/reports/components/ReportModal.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Modal para reportar tema, respuesta o usuario. Filtra autoreportes y envia razon/detalles al flujo de moderacion.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| `open` | `boolean` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `onClose` | `() => void` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `title` | `string` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `author` | `Profile` | No | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `options` | `ReportTargetOption[]` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |

## Estado interno
- `selectedType`: estado local inicializado con `availableOptions[0]?.type ?? options[0]?.type ?? 'topic'`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `reason`: estado local inicializado con `'spam'`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `details`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `error`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `success`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.

## Datos
- Origen: Redux store, profiles, replies, reports, topics.
- Tabla(s): profiles, replies, reports, topics.
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
- `../../auth/store/authSelectors`
- `../store/reportsSlice`
- `lucide-react`
- `react`
- `react-redux`

## Consumido por
- `src\features\threads\components\ReplyCard.tsx:15:import ReportModal from '../../reports/components/ReportModal'`
- `src\features\threads\components\ReplyCard.tsx:352:          <ReportModal`
- `src\features\threads\components\TopicHeader.tsx:13:import ReportModal from '../../reports/components/ReportModal'`
- `src\features\threads\components\TopicHeader.tsx:314:      <ReportModal`

## Comportamiento
- Enviar formulario valida campos locales, ejecuta acción async y muestra estado de envío/error.
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Usa Redux para disparar cambios globales y reflejar estados en otras partes de la app.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.
- Modales/overlays deben cerrar con botones visibles; no se detecta trap de foco generalizado salvo manejo local.

## Pendientes
- Sin TODOs visibles en el archivo; mantener sincronizado con cambios de código.
