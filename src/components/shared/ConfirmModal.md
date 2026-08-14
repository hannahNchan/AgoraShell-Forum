# ConfirmModal

**Ruta:** `src/components/shared/ConfirmModal.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Muestra confirmaciones globales para acciones destructivas. Resuelve o cancela la promesa abierta por el hook de confirmacion.

Para contexto global del sistema, ver [CODEX.md](../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| N/A | N/A | No | N/A | No recibe props públicas; obtiene datos por hooks, router o store. |

## Estado interno
No guarda estado interno propio; depende de props, store, router o hooks externos.

## Datos
- Origen: Redux store, hooks internos.
- Tabla(s): no consulta tablas Supabase directamente.
- RLS: no aplica directamente porque no consulta Supabase.
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: no maneja estado de carga propio detectado.
- Error: no muestra error propio detectado.
- Vacío: no se detectó empty state dedicado.

## Dependencias
- `../../hooks/useConfirm`
- `../../store`
- `../../store/confirmSlice`
- `react-redux`

## Consumido por
- `src\layouts\MainLayout.tsx:16:import ConfirmModal from '../components/shared/ConfirmModal'`
- `src\layouts\MainLayout.tsx:596:      <ConfirmModal />`

## Comportamiento
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Usa Redux para disparar cambios globales y reflejar estados en otras partes de la app.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Modales/overlays deben cerrar con botones visibles; no se detecta trap de foco generalizado salvo manejo local.

## Pendientes
- Sin TODOs visibles en el archivo; mantener sincronizado con cambios de código.
