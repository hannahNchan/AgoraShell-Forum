# UserProfilePage

**Ruta:** `src/features/profile/pages/UserProfilePage.tsx`
**Tipo:** página
**Estado:** estable

## Qué hace
Muestra perfil publico, reputacion y actividad reciente de un usuario. Agrega temas, respuestas y badges para resumir contribuciones.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
- `profile`: estado local inicializado con `null`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `topics`: estado local inicializado con `[]`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `replies`: estado local inicializado con `[]`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `reputation`: estado local inicializado con `null`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `badges`: estado local inicializado con `[]`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `loading`: estado local inicializado con `true`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `error`: estado local inicializado con `null`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `activeTab`: estado local inicializado con `'activity'`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.

## Datos
- Origen: React Router, profiles, replies, topics, user_reputation_badges, user_reputation_scores.
- Tabla(s): profiles, replies, topics, user_reputation_badges, user_reputation_scores.
- RLS citada textual desde `supabase/migrations`; ver también `CODEX.md` para auditoría CLI.
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
- Error: muestra mensajes locales, errores de store o fallback según el componente.
- Vacío: renderiza empty state cuando no hay datos.

## Dependencias
- `../../../components/shared/Spinner`
- `../../../services/supabase`
- `../../../types`
- `../../reputation/components/ReputationBadge`
- `../../reputation/reputation`
- `date-fns`
- `date-fns/locale`
- `lucide-react`
- `react`
- `react-router-dom`

## Consumido por
- Ruta: `/users/:username` en `src/routes/index.tsx`.

## Comportamiento
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.

## Pendientes
- Pendiente: confirmar policies RLS remotas para las tablas consultadas antes de cambiar filtros o permisos.
