# SearchPage

**Ruta:** `src/features/search/pages/SearchPage.tsx`
**Tipo:** página
**Estado:** estable

## Qué hace
Ejecuta busqueda por query URL y agrupa resultados por tags, canales, temas y respuestas. Evita buscar cuando la consulta es demasiado corta.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
- `channels`: estado local inicializado con `[]`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `topics`: estado local inicializado con `[]`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `replies`: estado local inicializado con `[]`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `tags`: estado local inicializado con `[]`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `loading`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.

## Datos
- Origen: React Router, channels, replies, tags, topics.
- Tabla(s): channels, replies, tags, topics.
- RLS citada textual desde `supabase/migrations`; ver también `CODEX.md` para auditoría CLI.
Policy textual de insert para `channels`:
```sql
create policy "emergency_lock_channels_insert" on public.channels as restrictive for insert to authenticated with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role_id = 1) or not coalesce((select foro_bloqueado from public.app_settings where id = 1), false));
create policy "restrictions_channels_insert" on public.channels as restrictive for insert to authenticated with check (public.user_can_create_content(auth.uid()));
```
Policy textual de insert para `replies`:
```sql
create policy "emergency_lock_replies_insert" on public.replies as restrictive for insert to authenticated with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role_id = 1) or not coalesce((select foro_bloqueado from public.app_settings where id = 1), false));
create policy "restrictions_replies_insert" on public.replies as restrictive for insert to authenticated with check (public.user_can_create_content(auth.uid()));
```
Policy textual de insert para `tags`:
```sql
create policy "restrictions_tags_insert" on public.tags as restrictive for insert to authenticated with check (public.user_can_create_content(auth.uid()));
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
- `../../../services/supabase`
- `lucide-react`
- `react`
- `react-router-dom`

## Consumido por
- Ruta: `/search` en `src/routes/index.tsx`.

## Comportamiento
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.

## Pendientes
- Pendiente: confirmar policies RLS remotas para las tablas consultadas antes de cambiar filtros o permisos.
