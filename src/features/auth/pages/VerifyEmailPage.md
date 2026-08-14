# VerifyEmailPage

**Ruta:** `src/features/auth/pages/VerifyEmailPage.tsx`
**Tipo:** página
**Estado:** estable

## Qué hace
Permite ingresar codigo OTP, reenviar verificacion y manejar cooldown. Completa el registro/verificacion por email.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
- `digits`: estado local inicializado con `Array(OTP_LENGTH).fill('')`; `OTP_LENGTH` vale 8 para coincidir con la configuración remota de Supabase Auth.
- `verifying`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `resending`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `error`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `resendSuccess`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `cooldown`: estado local inicializado con `0`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `inputRefs`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `cooldownRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.

## Datos
- Origen: React Router, Redux store, profiles.
- Tabla(s): profiles.
- RLS: ⚠️ POR CONFIRMAR para estas tablas en remoto; el CLI 2.76.12 no expone `db execute/query` y `db dump` falló por `SUPABASE_DB_PASSWORD`. Ver auditoría en `CODEX.md`.
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: renderiza `Spinner`, estados `loading` o texto de carga según el flujo.
- Error: muestra mensajes locales, errores de store o fallback según el componente.
- Vacío: no se detectó empty state dedicado.

## Dependencias
- `../../../components/shared/Spinner`
- `../../../store`
- `../store/authSlice`
- `react`
- `react-redux`
- `react-router-dom`

## Consumido por
- Ruta: `/verify-email` en `src/routes/index.tsx`.

## Comportamiento
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Navega programáticamente después de acciones exitosas o al seleccionar resultados.
- Usa Redux para disparar cambios globales y reflejar estados en otras partes de la app.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.
- Hay manejo de refs/foco o medición; mantener cleanup y orden de foco.

## Pendientes
- No se detectaron TODOs directos en el componente.
