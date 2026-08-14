# FeedTopicCard

**Ruta:** `src/features/forums/components/FeedTopicCard.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Tarjeta del feed principal con vista previa de replies y navegacion al tema. Consume stars del feed y contexto de canal.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| `topic` | `Topic` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |

## Estado interno
- `expanded`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `replies`: estado local inicializado con `[]`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `loadingReplies`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `fetched`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.

## Datos
- Origen: Redux store, hooks internos, replies, tags, topic_rules, topic_stars, topic_tags, topics.
- Tabla(s): replies, tags, topic_rules, topic_stars, topic_tags, topics.
- RLS citada textual desde `supabase/migrations`; ver también `CODEX.md` para auditoría CLI.
Policy textual de insert para `replies`:
```sql
create policy "emergency_lock_replies_insert" on public.replies as restrictive for insert to authenticated with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role_id = 1) or not coalesce((select foro_bloqueado from public.app_settings where id = 1), false));
create policy "restrictions_replies_insert" on public.replies as restrictive for insert to authenticated with check (public.user_can_create_content(auth.uid()));
```
Policy textual de insert para `tags`:
```sql
create policy "restrictions_tags_insert" on public.tags as restrictive for insert to authenticated with check (public.user_can_create_content(auth.uid()));
```
Policy textual para `topic_rules`:
```sql
create policy "topic_rules_select_public"
on public.topic_rules
for select
using (true);

create policy "topic_rules_insert_moderator"
on public.topic_rules
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id in (1, 2)
      and (profiles.suspended_until is null or profiles.suspended_until <= now())
  )
);

create policy "topic_rules_delete_moderator"
on public.topic_rules
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id in (1, 2)
      and (profiles.suspended_until is null or profiles.suspended_until <= now())
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
- Error: no muestra error propio detectado.
- Vacío: no se detectó empty state dedicado.

## Dependencias
- `../../../components/shared/Spinner`
- `../../../components/shared/UserLink`
- `../../../services/supabase`
- `../../../store`
- `../../../types`
- `../../auth/hooks/useAuth`
- `../../reputation/components/ReputationBadge`
- `../../threads/components/ImageCarousel`
- `../../threads/store/threadsSlice`
- `date-fns`
- `date-fns/locale`
- `lucide-react`
- `react`
- `react-redux`
- `react-router-dom`

## Consumido por
- `src\features\forums\pages\HomePage.tsx:7:import FeedTopicCard from '../components/FeedTopicCard'`
- `src\features\forums\pages\HomePage.tsx:152:                <FeedTopicCard key={topic.id} topic={topic} />`

## Comportamiento
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Usa Redux para disparar cambios globales y reflejar estados en otras partes de la app.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.

## Pendientes
- Deuda: usa `any`; tipar contra `types.db.ts` o tipos de dominio cuando se toque.
- Pendiente: confirmar policies RLS remotas para las tablas consultadas antes de cambiar filtros o permisos.
