# HotTopicsPage

**Ruta:** `src/features/threads/pages/HotTopicsPage.tsx`
**Tipo:** página
**Estado:** estable

## Qué hace
Calcula y muestra temas calientes con una puntuacion local basada en actividad reciente. Ayuda a descubrir conversaciones con traccion.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
- `topics`: estado local inicializado con `[]`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `loading`: estado local inicializado con `true`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.

## Datos
- Origen: topics.
- Tabla(s): topics.
- RLS citada textual desde `supabase/migrations`; ver también `CODEX.md` para auditoría CLI.
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
- `date-fns`
- `date-fns/locale`
- `lucide-react`
- `react`
- `react-router-dom`

## Consumido por
- Ruta: `/hot` en `src/routes/index.tsx`.

## Comportamiento
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.

## Pendientes
- Deuda: usa `any`; tipar contra `types.db.ts` o tipos de dominio cuando se toque.
- Pendiente: confirmar policies RLS remotas para las tablas consultadas antes de cambiar filtros o permisos.
