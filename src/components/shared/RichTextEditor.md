# RichTextEditor

**Ruta:** `src/components/shared/RichTextEditor.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Editor enriquecido para escribir temas y respuestas con formato, codigo, links, menciones e imagenes. Sube imagenes al storage y entrega HTML al componente padre.

Para contexto global del sistema, ver [CODEX.md](../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| `content` | `string` | No | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `onChange` | `(html: string) => void` | Sí | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `placeholder` | `string` | No | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `minHeight` | `string` | No | N/A | Ver uso en el componente; no hay documentación inline adicional. |

## Estado interno
- `url`: estado local inicializado con `initialUrl`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `showLinkPopover`: estado local inicializado con `false`; se invalida por interacción del usuario, cierre del flujo o recarga de datos.
- `inputRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.
- `linkButtonRef`: referencia DOM/imperativa para foco, medición, timers o cleanup.

## Datos
- Origen: Redux store, images, storage:images.
- Tabla(s): images.
- Storage: storage:images.
- RLS: ⚠️ POR CONFIRMAR para estas tablas en remoto; el CLI 2.76.12 no expone `db execute/query` y `db dump` falló por `SUPABASE_DB_PASSWORD`. Ver auditoría en `CODEX.md`.
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: no maneja estado de carga propio detectado.
- Error: muestra mensajes locales, errores de store o fallback según el componente.
- Vacío: renderiza empty state cuando no hay datos.

## Dependencias
- `../../services/supabase`
- `./mentionSuggestion`
- `@tiptap/extension-code-block-lowlight`
- `@tiptap/extension-link`
- `@tiptap/extension-mention`
- `@tiptap/extension-placeholder`
- `@tiptap/react`
- `@tiptap/starter-kit`
- `lowlight`
- `react`
- `tiptap-extension-resize-image`

## Consumido por
- `src\features\threads\pages\ThreadDetailPage.tsx:14:import RichTextEditor from '../../../components/shared/RichTextEditor'`
- `src\features\threads\pages\ThreadDetailPage.tsx:144:            <RichTextEditor`
- `src\features\threads\pages\ThreadPage.tsx:14:import RichTextEditor from '../../../components/shared/RichTextEditor'`
- `src\features\threads\pages\ThreadPage.tsx:133:              <RichTextEditor`
- `src\features\threads\components\CreateTopicModal.tsx:7:import RichTextEditor from '../../../components/shared/RichTextEditor'`
- `src\features\threads\components\CreateTopicModal.tsx:90:            <RichTextEditor onChange={setContent} placeholder="Escribe el contenido de tu tema..." minHeight="200px" />`
- `src\features\threads\components\EditTopicModal.tsx:6:import RichTextEditor from '../../../components/shared/RichTextEditor'`
- `src\features\threads\components\EditTopicModal.tsx:70:            <RichTextEditor`

## Comportamiento
- Clicks del usuario abren/cierran modales, navegan, alternan estados o despachan acciones según botón.
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Usa Redux para disparar cambios globales y reflejar estados en otras partes de la app.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.
- Formularios usan inputs/textareas nativos; revisar labels y foco al modificar.
- Hay manejo de refs/foco o medición; mantener cleanup y orden de foco.
- Modales/overlays deben cerrar con botones visibles; no se detecta trap de foco generalizado salvo manejo local.

## Pendientes
- Pendiente: confirmar policies RLS remotas para las tablas consultadas antes de cambiar filtros o permisos.
