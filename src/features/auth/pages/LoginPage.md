# LoginPage

**Ruta:** `src/features/auth/pages/LoginPage.tsx`
**Tipo:** página
**Estado:** estable

## Qué hace
Contiene los formularios de inicio de sesion y registro. Maneja errores de autenticacion y redirige al flujo de verificacion cuando aplica.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
No guarda estado interno propio; depende de props, store, router o hooks externos.

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
- `@hookform/resolvers/zod`
- `react-hook-form`
- `react-redux`
- `react-router-dom`
- `zod`

## Consumido por
- Ruta: `/login y /register` en `src/routes/index.tsx`.

## Comportamiento
- Enviar formulario valida campos locales, ejecuta acción async y muestra estado de envío/error.
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Navega programáticamente después de acciones exitosas o al seleccionar resultados.
- Usa Redux para disparar cambios globales y reflejar estados en otras partes de la app.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.

## Pendientes
- Deuda: usa `any`; tipar contra `types.db.ts` o tipos de dominio cuando se toque.
