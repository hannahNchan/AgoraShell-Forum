# MentionList

**Ruta:** `src/components/shared/MentionList.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Muestra sugerencias de usuarios para menciones dentro del editor. Permite navegar con teclado y seleccionar una mencion.

Para contexto global del sistema, ver [CODEX.md](../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| `items` | `MentionUser[]` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `command` | `(item: { id: string; label: string }) => void` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |

## Estado interno
- `selectedIndex`: estado local inicializado con `0`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.

## Datos
- Origen: props o render local; no consulta datos remotos directamente.
- Tabla(s): no consulta tablas Supabase directamente.
- RLS: no aplica directamente porque no consulta Supabase.
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: no maneja estado de carga propio detectado.
- Error: no muestra error propio detectado.
- Vacío: no se detectó empty state dedicado.

## Dependencias
- `./mentionSuggestion`
- `react`

## Consumido por
- ⚠️ POR CONFIRMAR: no se detectó consumidor directo con búsqueda textual.

## Comportamiento
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.

## Pendientes
- Deuda: usa `any`; tipar contra `types.db.ts` o tipos de dominio cuando se toque.
