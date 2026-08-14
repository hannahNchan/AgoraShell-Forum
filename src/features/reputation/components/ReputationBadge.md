# ReputationBadge

**Ruta:** `src/features/reputation/components/ReputationBadge.tsx`
**Tipo:** contenedor
**Estado:** estable

## Qué hace
Muestra reputacion resumida de un usuario. Puede usar datos recibidos o consultar el score remoto si solo tiene userId.

Para contexto global del sistema, ver [CODEX.md](../../../../CODEX.md).

## API
| Prop | Tipo | Requerido | Default | Descripción |
| --- | --- | --- | --- | --- |
| `userId` | `string \| null` | No | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `summary` | `Pick<ReputationSummary, 'shell_score' \| 'level_name'> \| null` | No | N/A | Ver uso en el componente; no hay documentación inline adicional. |
| `compact` | `boolean` | No | N/A | Ver uso en el componente; no hay documentación inline adicional. |

## Estado interno
No guarda estado interno propio; depende de props, store, router o hooks externos.

## Datos
- Origen: user_reputation_scores.
- Tabla(s): user_reputation_scores.
- RLS: ⚠️ POR CONFIRMAR para estas tablas en remoto; el CLI 2.76.12 no expone `db execute/query` y `db dump` falló por `SUPABASE_DB_PASSWORD`. Ver auditoría en `CODEX.md`.
- Efecto de la RLS: cuando hay policy citada, Supabase puede ocultar o rechazar filas según `auth.uid()` y rol; cuando está por confirmar, validar contra catálogo remoto antes de cambiar queries.
- Carga: no maneja estado de carga propio detectado.
- Error: no muestra error propio detectado.
- Vacío: no se detectó empty state dedicado.

## Dependencias
- `../../../services/supabase`
- `../reputation`
- `lucide-react`
- `react`

## Consumido por
- `src\features\profile\pages\UserProfilePage.tsx:10:import ReputationBadge from '../../reputation/components/ReputationBadge'`
- `src\features\profile\pages\UserProfilePage.tsx:199:                  <ReputationBadge summary={reputation} />`
- `src\features\forums\components\FeedTopicCard.tsx:15:import ReputationBadge from '../../reputation/components/ReputationBadge'`
- `src\features\forums\components\FeedTopicCard.tsx:87:              <ReputationBadge userId={topic.author?.id} compact />`
- `src\features\threads\components\TopicHeader.tsx:15:import ReputationBadge from '../../reputation/components/ReputationBadge'`
- `src\features\threads\components\TopicHeader.tsx:111:            <ReputationBadge userId={topic.author?.id} compact />`
- `src\features\threads\components\ReplyCard.tsx:17:import ReputationBadge from '../../reputation/components/ReputationBadge'`
- `src\features\threads\components\ReplyCard.tsx:197:              <ReputationBadge userId={reply.author?.id} compact />`

## Comportamiento
- Al montar o cambiar dependencias, ejecuta efectos para cargar datos, suscribirse o limpiar recursos.
- Casos borde: validar permisos, estados vacíos y errores de Supabase antes de asumir que la acción fue exitosa.

## Accesibilidad
- No se detectaron atributos ARIA dedicados.

## Pendientes
- Pendiente: confirmar policies RLS remotas para las tablas consultadas antes de cambiar filtros o permisos.
