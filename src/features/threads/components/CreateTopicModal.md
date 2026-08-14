# CreateTopicModal

**Ruta:** `src/features/threads/components/CreateTopicModal.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Modal para crear un tema con titulo, contenido, tags y reglas opcionales. Bloquea publicacion si el foro esta cerrado o faltan campos.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| `channelId` | `string` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `onClose` | `() => void` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `maxTags` | `number` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |

## Estado interno
- `title`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `content`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `selectedTags`: estado local inicializado con `[]`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `rules`: estado local inicializado con `['']`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `submitting`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.

## Datos
- Origen: Redux store, app_settings, hooks internos, tags, topic_rules, topic_stars, topic_tags, topics.
- Tabla(s): app_settings, tags, topic_rules, topic_stars, topic_tags, topics.
- RLS citada textual desde `supabase/migrations`; ver también `CODEX.md` para auditoría CLI.
Policy textual para `app_settings`:
```sql
create policy "app_settings_update_admin"
on public.app_settings
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id = 1
  )
)
with check (
  id = 1
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role_id = 1
  )
);
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
- `../../../components/shared/RichTextEditor`
- `../../../components/shared/Spinner`
- `../../../hooks/useForoBloqueado`
- `../../../store`
- `../../../types`
- `../../auth/hooks/useRole`
- `../../tags/components/TagInput`
- `../store/threadsSlice`
- `./TopicRulesEditor`
- `lucide-react`
- `react`
- `react-redux`

## Consumido por
- `src\features\threads\pages\ThreadsPage.tsx:7:import CreateTopicModal from '../components/CreateTopicModal'`
- `src\features\threads\pages\ThreadsPage.tsx:150:        <CreateTopicModal channelId={channelId} onClose={() => setShowCreate(false)} maxTags={maxTags} />`

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
