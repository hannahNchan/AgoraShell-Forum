# TagInput

**Ruta:** `src/features/tags/components/TagInput.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Selector de tags con busqueda, creacion y remocion. Debouncea sugerencias y respeta limite maximo.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| `selected` | `Tag[]` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `onChange` | `(tags: Tag[]) => void` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `maxTags` | `number` | No | N/A | Ver uso en el componente; no hay documentación inline adicional. |

## Estado interno
- `query`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `suggestions`: estado local inicializado con `[]`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `showDropdown`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `creating`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `inputRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `dropdownRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `debounceRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.

## Datos
- Origen: Redux store, app_settings, tags.
- Tabla(s): app_settings, tags.
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
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: no maneja estado de carga propio detectado.
- Error: no muestra error propio detectado.
- Vacío: renderiza empty state cuando no hay datos.

## Dependencias
- `../../../services/supabase`
- `../../../store`
- `../../../types`
- `../store/tagsSlice`
- `lucide-react`
- `react`
- `react-redux`

## Consumido por
- `src\features\threads\components\CreateTopicModal.tsx:8:import TagInput from '../../tags/components/TagInput'`
- `src\features\threads\components\CreateTopicModal.tsx:94:            <TagInput selected={selectedTags} onChange={setSelectedTags} maxTags={maxTags} />`
- `src\features\threads\components\EditTopicModal.tsx:7:import TagInput from '../../tags/components/TagInput'`
- `src\features\threads\components\EditTopicModal.tsx:80:            <TagInput selected={selectedTags} onChange={setSelectedTags} maxTags={maxTags} />`
- `src\features\threads\components\TopicHeader.tsx:9:import TagInput from '../../tags/components/TagInput'`
- `src\features\threads\components\TopicHeader.tsx:188:                <TagInput selected={editTags} onChange={setEditTags} maxTags={maxTags} />`
- `src\features\threads\components\TopicHeader.tsx:234:            <TagInput selected={editTags} onChange={setEditTags} maxTags={maxTags} />`

## Comportamiento
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Usa Redux para disparar cambios globales y reflejar estados en otras partes de la app.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.
- Hay manejo de refs/foco o medición; mantener cleanup y orden de foco.

## Pendientes
- Pendiente: confirmar policies RLS remotas para las tablas consultadas antes de cambiar filtros o permisos.
