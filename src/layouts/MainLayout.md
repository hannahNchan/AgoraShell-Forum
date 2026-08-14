# MainLayout

**Ruta:** `src/layouts/MainLayout.tsx`
**Tipo:** layout
**Estado:** estable

## Qué hace
Construye la experiencia principal con sidebar, header, busqueda, navegacion de canales y menu de usuario. Controla acciones globales como crear canales, cambiar tema, abrir notificaciones y cerrar sesion.

Para contexto global del sistema, ver [CODEX.md](../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
- `name`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `description`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `icon`: estado local inicializado con `'💬'`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `submitting`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `error`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `showPicker`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `collapsed`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `mobileOpen`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `userMenuOpen`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `showCreateChannel`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `notifOpen`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.

## Datos
- Origen: React Router, Redux store, app_settings, channels, hooks internos, topics.
- Tabla(s): app_settings, channels, topics.
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
Policy textual de insert para `channels`:
```sql
create policy "emergency_lock_channels_insert" on public.channels as restrictive for insert to authenticated with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role_id = 1) or not coalesce((select foro_bloqueado from public.app_settings where id = 1), false));
create policy "restrictions_channels_insert" on public.channels as restrictive for insert to authenticated with check (public.user_can_create_content(auth.uid()));
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
- `../components/GlobalSearch`
- `../components/shared/ConfirmModal`
- `../components/shared/Spinner`
- `../features/auth/hooks/useAuth`
- `../features/auth/hooks/useRole`
- `../features/auth/store/authSlice`
- `../features/forums/store/forumsSlice`
- `../features/notifications/components/NotificationPanel`
- `../hooks/useConfirm`
- `../hooks/useDarkMode`
- `../hooks/useForoBloqueado`
- `../store`
- `../types`
- `emoji-picker-react`
- `react`
- `react-redux`
- `react-router-dom`

## Consumido por
- `src\routes\index.tsx:2:import MainLayout from '../layouts/MainLayout'`
- `src\routes\index.tsx:28:    element: <MainLayout />,`

## Comportamiento
- Enviar formulario valida campos locales, ejecuta acción async y muestra estado de envío/error.
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Navega programáticamente después de acciones exitosas o al seleccionar resultados.
- Usa Redux para disparar cambios globales y reflejar estados en otras partes de la app.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.
- Modales/overlays deben cerrar con botones visibles; no se detecta trap de foco generalizado salvo manejo local.

## Pendientes
- Deuda: usa `any`; tipar contra `types.db.ts` o tipos de dominio cuando se toque.
