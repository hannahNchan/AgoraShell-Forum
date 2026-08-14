# index

**Ruta:** `src/routes/index.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Componente con lógica propia dentro de AgoraShell Forum. Su comportamiento exacto se deriva del archivo fuente citado en la ruta.

Para contexto global del sistema, ver [CODEX.md](../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
No guarda estado interno propio; depende de props, store, router o hooks externos.

## Datos
- Origen: props o render local; no consulta datos remotos directamente.
- Tabla(s): no consulta tablas Supabase directamente.
- RLS: no aplica directamente porque no consulta Supabase.
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: no maneja estado de carga propio detectado.
- Error: no muestra error propio detectado.
- Vacío: no se detectó empty state dedicado.

## Dependencias
- `../../src/features/auth/pages/AdminPage.tsx`
- `../components/ComingSoon`
- `../features/auth/pages/AuthCallbackPage`
- `../features/auth/pages/LoginPage`
- `../features/auth/pages/SettingsPage.tsx`
- `../features/auth/pages/VerifyEmailPage`
- `../features/forums/pages/ForumsPage`
- `../features/forums/pages/HomePage`
- `../features/profile/pages/UserProfilePage`
- `../features/search/pages/SearchPage`
- `../features/tags/pages/TagPage`
- `../features/threads/pages/HotTopicsPage`
- `../features/threads/pages/ThreadDetailPage`
- `../features/threads/pages/ThreadPage`
- `../features/threads/pages/ThreadsPage`
- `../layouts/MainLayout`
- `react-router-dom`

## Consumido por
- ⚠️ POR CONFIRMAR: no se detectó consumidor directo con búsqueda textual.

## Comportamiento
- Renderiza contenido según props y delega interacciones al padre.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.

## Pendientes
- Sin TODOs visibles en el archivo; mantener sincronizado con cambios de código.
