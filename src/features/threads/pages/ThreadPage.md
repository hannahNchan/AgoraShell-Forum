# ThreadPage

**Ruta:** `src/features/threads/pages/ThreadPage.tsx`
**Tipo:** página
**Estado:** estable

## Qué hace
Muestra un hilo especifico de respuesta dentro de un tema. Sirve para abrir conversaciones profundas desde una reply concreta.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
- `replyContent`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `submitting`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `rulesOpen`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.

## Datos
- Origen: React Router, Redux store, app_settings, hooks internos, replies, reply_reactions, topics.
- Tabla(s): app_settings, replies, reply_reactions, topics.
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
Policy textual de insert para `replies`:
```sql
create policy "emergency_lock_replies_insert" on public.replies as restrictive for insert to authenticated with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role_id = 1) or not coalesce((select foro_bloqueado from public.app_settings where id = 1), false));
create policy "restrictions_replies_insert" on public.replies as restrictive for insert to authenticated with check (public.user_can_create_content(auth.uid()));
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
- `../../auth/hooks/useAuth`
- `../../auth/hooks/useRole`
- `../../auth/store/authSelectors`
- `../../posts/store/postsSlice`
- `../components/ReplyCard`
- `../components/TopicHeader`
- `../components/TopicRulesModal`
- `../components/TopicRulesReminder`
- `../hooks/useTopicDetail`
- `lucide-react`
- `react`
- `react-redux`
- `react-router-dom`

## Consumido por
- Ruta: `/channels/topics/:topicId/thread/:replyId` en `src/routes/index.tsx`.

## Comportamiento
- Enviar formulario valida campos locales, ejecuta acción async y muestra estado de envío/error.
- Usa Redux para disparar cambios globales y reflejar estados en otras partes de la app.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.
- Modales/overlays deben cerrar con botones visibles; no se detecta trap de foco generalizado salvo manejo local.

## Pendientes
- Sin TODOs visibles en el archivo; mantener sincronizado con cambios de código.
