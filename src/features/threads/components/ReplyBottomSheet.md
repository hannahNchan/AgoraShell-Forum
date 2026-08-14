# ReplyBottomSheet

**Ruta:** `src/features/threads/components/ReplyBottomSheet.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Caja movil/compacta para escribir una respuesta. Entrega contenido HTML al padre y permite cancelar o publicar.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| `open` | `boolean` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `onClose` | `() => void` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `onSubmit` | `(content: string) => Promise<void>` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `replyingTo` | `string` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `submitting` | `boolean` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `topicRules` | `TopicRule[]` | No | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `onOpenRules` | `() => void` | No | N/A | Ver uso en el componente; no hay documentación inline adicional. |

## Estado interno
- `content`: estado local inicializado con `''`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.

## Datos
- Origen: props o render local; no consulta datos remotos directamente.
- Tabla(s): no consulta tablas Supabase directamente.
- RLS: no aplica directamente porque no consulta Supabase.
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: renderiza `Spinner`, estados `loading` o texto de carga según el flujo.
- Error: no muestra error propio detectado.
- Vacío: no se detectó empty state dedicado.

## Dependencias
- `../../../components/shared/RichTextEditor`
- `../../../components/shared/Spinner`
- `../../../types`
- `./TopicRulesReminder`
- `lucide-react`
- `react`

## Consumido por
- `src\features\threads\components\ReplyCard.tsx:11:import ReplyBottomSheet from './ReplyBottomSheet'`
- `src\features\threads\components\ReplyCard.tsx:342:          <ReplyBottomSheet`

## Comportamiento
- Enviar formulario valida campos locales, ejecuta acción async y muestra estado de envío/error.
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Modales/overlays deben cerrar con botones visibles; no se detecta trap de foco generalizado salvo manejo local.

## Pendientes
- Sin TODOs visibles en el archivo; mantener sincronizado con cambios de código.
