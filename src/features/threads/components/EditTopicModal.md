# EditTopicModal

**Ruta:** `src/features/threads/components/EditTopicModal.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Modal para editar titulo, contenido, tags y reglas de un tema existente. Conserva datos iniciales y guarda cambios via Redux.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| `topic` | `Topic` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `onClose` | `() => void` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `maxTags` | `number` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |

## Estado interno
- `title`: estado local inicializado con `topic.title`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `content`: estado local inicializado con `topic.content`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `selectedTags`: estado local inicializado con `topic.tags || []`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `rules`: estado local inicializado con `topic.rules?.length ? topic.rules.map((rule) => rule.body) : ['']`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `submitting`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.

## Datos
- Origen: Redux store, hooks internos, tags, topic_rules, topic_stars, topic_tags, topics.
- Tabla(s): tags, topic_rules, topic_stars, topic_tags, topics.
- RLS citada textual desde `supabase/migrations`; ver también `CODEX.md` para auditoría CLI.
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
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: renderiza `Spinner`, estados `loading` o texto de carga según el flujo.
- Error: no muestra error propio detectado.
- Vacío: no se detectó empty state dedicado.

## Dependencias
- `../../../components/shared/RichTextEditor`
- `../../../components/shared/Spinner`
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
- `src\features\threads\components\ChannelTopicCard.tsx:15:import EditTopicModal from './EditTopicModal'`
- `src\features\threads\components\ChannelTopicCard.tsx:307:        <EditTopicModal topic={topic} onClose={() => setShowEditModal(false)} maxTags={maxTags} />`

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
