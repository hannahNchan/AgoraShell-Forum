# TopicHeader

**Ruta:** `src/features/threads/components/TopicHeader.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Cabecera del tema con contenido, autor, tags, reglas, acciones de edicion, reporte y estrella. Gestiona edicion inline y modal de reglas.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| `topic` | `Topic` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `isClosed` | `boolean` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `isModerator` | `boolean` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `isAuthenticated` | `boolean` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `isBanned` | `boolean` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `canEdit` | `boolean` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `canManageRules` | `boolean` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `canReport` | `boolean` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `maxTags` | `number` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `onStar` | `() => void` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `onClose` | `() => void` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `onSaveEdit` | `(title: string, content: string, tagIds: string[], rules?: string[]) => Promise<void>` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |

## Estado interno
- `isEditing`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `editTitle`: estado local inicializado con `topic.title`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `editContent`: estado local inicializado con `topic.content`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `editTags`: estado local inicializado con `topic.tags || []`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `editRules`: estado local inicializado con `topic.rules?.length ? topic.rules.map((rule) => rule.body) : ['']`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `saving`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `isEditingRules`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `savingRules`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `reportOpen`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `topicContentRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.

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
- `../../../components/shared/UserLink`
- `../../../hooks/useCodeCollapse`
- `../../../hooks/useHighlightCode`
- `../../../types`
- `../../reports/components/ReportModal`
- `../../reputation/components/ReputationBadge`
- `../../tags/components/TagInput`
- `./ReplyCard`
- `./TopicRulesEditor`
- `date-fns`
- `date-fns/locale`
- `lucide-react`
- `react`
- `react-router-dom`

## Consumido por
- `src\features\threads\pages\ThreadDetailPage.tsx:11:import TopicHeader from '../components/TopicHeader'`
- `src\features\threads\pages\ThreadDetailPage.tsx:72:      <TopicHeader`
- `src\features\threads\pages\ThreadPage.tsx:11:import TopicHeader from '../components/TopicHeader'`
- `src\features\threads\pages\ThreadPage.tsx:73:      <TopicHeader`

## Comportamiento
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.
- Hay manejo de refs/foco o medición; mantener cleanup y orden de foco.
- Modales/overlays deben cerrar con botones visibles; no se detecta trap de foco generalizado salvo manejo local.

## Pendientes
- Sin TODOs visibles en el archivo; mantener sincronizado con cambios de código.
