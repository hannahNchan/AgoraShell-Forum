# SettingsPage

**Ruta:** `src/features/auth/pages/SettingsPage.tsx`
**Tipo:** página
**Estado:** estable

## Qué hace
Permite editar identidad publica y avatar del usuario. Incluye recorte de imagen, validaciones de username/bio y subida a storage.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| `profile` | `Profile` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `user` | `User` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |

## Estado interno
- `imageSrc`: estado local inicializado con `null`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `crop`: estado local inicializado con `{ x: 0, y: 0 }`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `zoom`: estado local inicializado con `1`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `croppedAreaPixels`: estado local inicializado con `null`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `saving`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `success`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `identitySaving`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `identitySuccess`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `identityError`: estado local inicializado con `null`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `username`: estado local inicializado con `profile?.username ?? ''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `bio`: estado local inicializado con `profile?.bio ?? ''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `dragging`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `inputRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.

## Datos
- Origen: Redux store, profiles.
- Tabla(s): profiles.
- RLS: ⚠️ POR CONFIRMAR para estas tablas en remoto; el CLI 2.76.12 no expone `db execute/query` y `db dump` falló por `SUPABASE_DB_PASSWORD`. Ver auditoría en `CODEX.md`.
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: renderiza `Spinner`, estados `loading` o texto de carga según el flujo.
- Error: muestra mensajes locales, errores de store o fallback según el componente.
- Vacío: renderiza empty state cuando no hay datos.

## Dependencias
- `../../../components/shared/Spinner`
- `../../../components/shared/UserLink`
- `../../../store`
- `../../../types`
- `../store/authSlice`
- `@supabase/supabase-js`
- `lucide-react`
- `react`
- `react-easy-crop`
- `react-redux`

## Consumido por
- Ruta: `/settings` en `src/routes/index.tsx`.

## Comportamiento
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Usa Redux para disparar cambios globales y reflejar estados en otras partes de la app.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.
- Hay manejo de refs/foco o medición; mantener cleanup y orden de foco.

## Pendientes
- Pendiente: confirmar policies RLS remotas para las tablas consultadas antes de cambiar filtros o permisos.
