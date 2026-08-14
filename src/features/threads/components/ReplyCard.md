# ReplyCard

**Ruta:** `src/features/threads/components/ReplyCard.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Renderiza una respuesta y sus hijos con acciones de editar, responder, reaccionar, reportar y borrar. Dibuja conexiones visuales entre replies anidadas.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| `reply` | `Reply` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `topicId` | `string` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `topicClosed` | `boolean` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `topicRules` | `TopicRule[]` | No | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `onOpenRules` | `() => void` | No | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `depth` | `number` | No | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `maxDepth` | `number` | No | N/A | Ver uso en el componente; no hay documentación inline adicional. |

## Estado interno
- `reportOpen`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `replyContentRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `linesRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `scrollHandlerRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `repositionTimersRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `containerRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.

## Datos
- Origen: React Router, hooks internos, replies, reply_reactions.
- Tabla(s): replies, reply_reactions.
- RLS citada textual desde `supabase/migrations`; ver también `CODEX.md` para auditoría CLI.
Policy textual de insert para `replies`:
```sql
create policy "emergency_lock_replies_insert" on public.replies as restrictive for insert to authenticated with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role_id = 1) or not coalesce((select foro_bloqueado from public.app_settings where id = 1), false));
create policy "restrictions_replies_insert" on public.replies as restrictive for insert to authenticated with check (public.user_can_create_content(auth.uid()));
```
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: renderiza `Spinner`, estados `loading` o texto de carga según el flujo.
- Error: no muestra error propio detectado.
- Vacío: no se detectó empty state dedicado.

## Dependencias
- `../../../components/shared/RichTextEditor`
- `../../../components/shared/Spinner`
- `../../../components/shared/UserLink`
- `../../../hooks/useCodeCollapse`
- `../../../hooks/useHighlightCode`
- `../../../types`
- `../../posts/store/postsSlice`
- `../../reports/components/ReportModal`
- `../../reputation/components/ReputationBadge`
- `../hooks/useReply`
- `./ReplyBottomSheet`
- `./TopicRulesReminder`
- `date-fns`
- `date-fns/locale`
- `emoji-picker-react`
- `lucide-react`
- `react`
- `react-router-dom`

## Consumido por
- `src\features\threads\pages\ThreadDetailPage.tsx:12:import ReplyCard from '../components/ReplyCard'`
- `src\features\threads\pages\ThreadDetailPage.tsx:98:            <ReplyCard key={reply.id} reply={reply} topicId={topicId!} topicClosed={isClosed} topicRules={topicRules} onOpenRules={() => setRulesOpen(true)} depth={0} />`
- `src\features\threads\pages\ThreadPage.tsx:12:import ReplyCard from '../components/ReplyCard'`
- `src\features\threads\pages\ThreadPage.tsx:106:          <ReplyCard`
- `src\features\threads\components\ReplyCard.tsx:377:                <ReplyCard`
- `src\features\threads\components\TopicHeader.tsx:11:import { Avatar } from './ReplyCard'`

## Comportamiento
- Enviar formulario valida campos locales, ejecuta acción async y muestra estado de envío/error.
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Navega programáticamente después de acciones exitosas o al seleccionar resultados.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.
- Hay manejo de refs/foco o medición; mantener cleanup y orden de foco.
- Modales/overlays deben cerrar con botones visibles; no se detecta trap de foco generalizado salvo manejo local.

## Pendientes
- Sin TODOs visibles en el archivo; mantener sincronizado con cambios de código.
