# TagPage

**Ruta:** `src/features/tags/pages/TagPage.tsx`
**Tipo:** página
**Estado:** estable

## Qué hace
Muestra temas asociados a un tag y carga mas resultados con scroll infinito. Mantiene el contexto del tag por slug.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
- `tag`: estado local inicializado con `null`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `topics`: estado local inicializado con `[]`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `loading`: estado local inicializado con `true`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `loadingMore`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `hasMore`: estado local inicializado con `true`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `totalCount`: estado local inicializado con `0`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `pageRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `loaderRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `loadingMoreRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `hasMoreRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.

## Datos
- Origen: React Router, tags, topic_tags.
- Tabla(s): tags, topic_tags.
- RLS citada textual desde `supabase/migrations`; ver también `CODEX.md` para auditoría CLI.
Policy textual de insert para `tags`:
```sql
create policy "restrictions_tags_insert" on public.tags as restrictive for insert to authenticated with check (public.user_can_create_content(auth.uid()));
```
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: renderiza `Spinner`, estados `loading` o texto de carga según el flujo.
- Error: muestra mensajes locales, errores de store o fallback según el componente.
- Vacío: renderiza empty state cuando no hay datos.

## Dependencias
- `../../../components/shared/Spinner`
- `../../../services/supabase`
- `../../../types`
- `date-fns`
- `date-fns/locale`
- `lucide-react`
- `react`
- `react-router-dom`

## Consumido por
- Ruta: `/tags/:slug` en `src/routes/index.tsx`.

## Comportamiento
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.
- Hay manejo de refs/foco o medición; mantener cleanup y orden de foco.

## Pendientes
- Deuda: usa `any`; tipar contra `types.db.ts` o tipos de dominio cuando se toque.
- Pendiente: confirmar policies RLS remotas para las tablas consultadas antes de cambiar filtros o permisos.
