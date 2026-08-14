# AdminPage

**Ruta:** `src/features/auth/pages/AdminPage.tsx`
**Tipo:** página
**Estado:** estable

## Qué hace
Centraliza administracion y moderacion: usuarios, roles, bloqueo global, reportes y auditoria. Cambia comportamiento segun permisos del perfil.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
- `users`: estado local inicializado con `[]`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `loading`: estado local inicializado con `true`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `saving`: estado local inicializado con `null`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `userError`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `maxTagsInput`: estado local inicializado con `3`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `savingSettings`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `settingsSaved`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `maxDepthInput`: estado local inicializado con `5`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `savingDepth`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `depthSaved`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `foroBloqueado`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `savingBloqueo`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `bloqueoError`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `restrictionModal`: estado local inicializado con `null`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `reason`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `reasonId`: estado local inicializado con `MODERATION_REASONS[0].id`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `durationDays`: estado local inicializado con `7`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `modalError`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.

## Datos
- Origen: Redux store, app_settings, profiles, tags.
- Tabla(s): app_settings, profiles, tags.
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
- Carga: renderiza `Spinner`, estados `loading` o texto de carga según el flujo.
- Error: muestra mensajes locales, errores de store o fallback según el componente.
- Vacío: renderiza empty state cuando no hay datos.

## Dependencias
- `../../../components/shared/Spinner`
- `../../../services/adminAudit`
- `../../../services/permissions`
- `../../../services/supabase`
- `../../../store`
- `../../../types`
- `../../adminAudit/components/AdminAuditPanel`
- `../../reports/components/ReportsAdminPanel`
- `../../reports/constants/moderationCatalog`
- `../../tags/store/tagsSlice`
- `../store/authSelectors`
- `lucide-react`
- `react`
- `react-redux`

## Consumido por
- Ruta: `/admin` en `src/routes/index.tsx`.

## Comportamiento
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Usa Redux para disparar cambios globales y reflejar estados en otras partes de la app.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- Incluye atributos ARIA detectados en el JSX; conservarlos al refactorizar.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.
- Modales/overlays deben cerrar con botones visibles; no se detecta trap de foco generalizado salvo manejo local.

## Pendientes
- Sin TODOs visibles en el archivo; mantener sincronizado con cambios de código.
