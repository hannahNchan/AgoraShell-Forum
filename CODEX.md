# CODEX.md

Ultima actualizacion: 2026-08-14

Este archivo es el contexto operativo para agentes de IA que trabajen en AgoraShell Forum. Toda afirmacion debe poder rastrearse a archivos del repositorio. Si algo no esta versionado o no se puede confirmar leyendo el codigo, queda marcado como `⚠️ POR CONFIRMAR`.

## 1. Proposito del proyecto

AgoraShell Forum es una aplicacion web tipo foro/comunidad donde usuarios autenticados crean canales, temas y respuestas, reaccionan a contenido, reportan abusos y consultan feeds de temas. La experiencia esta orientada a conversaciones organizadas por canales, tags y perfiles, con moderacion para admins/mods. La app tambien incluye reputacion, notificaciones, bloqueo global del foro y reglas opcionales por tema. Evidencia: rutas en `src/routes/index.tsx`, tipos de dominio en `src/types/index.ts`, slices en `src/features/*/store`.

## 2. Stack tecnico

Versiones exactas observadas con `npm ls --depth=0` y `package-lock.json`; rangos declarados en `package.json`.

| Tecnologia | Version instalada | Uso |
| --- | --- | --- |
| Vite | 7.3.1 | Build/dev server; config en `vite.config.ts`; script `dev` en `package.json`. |
| React | 19.2.4 | UI principal; entrada en `src/main.tsx`. |
| React DOM | 19.2.4 | Render de React en browser; usado en `src/main.tsx`. |
| React Router DOM | 7.13.0 | Rutas SPA; definidas en `src/routes/index.tsx`. |
| Redux Toolkit | 2.11.2 | Estado global y thunks; store en `src/store/index.ts`. |
| React Redux | 9.2.0 | Provider y hooks de Redux; `Provider` en `src/main.tsx`. |
| Supabase JS | 2.97.0 | Auth, REST, Realtime y Storage; cliente en `src/services/supabase.ts`. |
| Supabase CLI package | 2.76.12 | CLI local/versionado en devDependency; config en `supabase/config.toml`. |
| TypeScript | 5.9.3 | Tipado estricto; configs `tsconfig*.json`. |
| ESLint | 9.39.3 | Lint flat config; `eslint.config.js`. |
| typescript-eslint | 8.56.0 | Reglas TS para ESLint; `eslint.config.js`. |
| Tailwind CSS Vite plugin | 4.2.0 | Tailwind v4 via Vite; `vite.config.ts`, `src/index.css`. |
| Tailwind Typography | 0.5.19 | Estilos `.prose`; importado en `src/index.css`. |
| Tiptap | 3.20.x | Rich text editor y extensiones; `src/components/shared/RichTextEditor.tsx`. |
| lucide-react | 0.575.0 | Iconos UI; usado en layouts/componentes. |
| react-hook-form | 7.71.2 | Formularios auth/settings; ejemplo `src/features/auth/pages/LoginPage.tsx`. |
| zod | 4.3.6 | Validacion de formularios; ejemplo `src/features/auth/pages/LoginPage.tsx`. |
| emoji-picker-react | 4.18.0 | Selector de iconos de canales; `src/layouts/MainLayout.tsx`. |
| date-fns | 4.1.0 | Formato relativo de fechas; usado en componentes de feed/respuestas. |
| lowlight | 3.3.0 | Highlight de bloques de codigo; `src/hooks/useHighlightCode.ts`, Tiptap. |

Scripts confirmados en `package.json`:

```bash
npm run dev      # vite --port 6699
npm run build    # tsc -b && vite build
npm run lint     # eslint .
npm run preview  # vite preview
```

## 3. Arquitectura

Capas reales:

- Entrada: `src/main.tsx` monta React en `#root`, envuelve con Redux `Provider` y carga `src/index.css`.
- App shell: `src/App.tsx` hidrata sesion auth con `loadAuthUser()` y escucha `supabase.auth.onAuthStateChange`.
- Router/layout: `src/routes/index.tsx` define rutas; `src/layouts/MainLayout.tsx` maneja sidebar, search, usuario, notificaciones y modal de canal.
- Estado: `src/store/index.ts` combina slices por dominio (`auth`, `channels`, `topics`, `posts`, `feed`, `tags`, `reports`, `adminAudit`, `notifications`, `confirm`).
- Servicios: `src/services/*` centraliza Supabase client, permisos, guard de sesion, lock del foro, restricciones y auditoria.
- Features: `src/features/<dominio>` agrupa paginas, componentes, hooks y stores.
- Base de datos: `supabase/migrations/*.sql`, config local `supabase/config.toml`, seeds/mocks en `supabase/mocks`.

Flujo de datos tipico:

```text
Usuario
  -> componente/page React
  -> hook de feature o dispatch Redux thunk
  -> servicio/cliente Supabase
  -> tabla/RPC/storage/realtime Supabase
  -> thunk fulfilled/rejected
  -> slice Redux actualiza loading/error/items
  -> componente re-renderiza spinner, error, empty state o datos
```

Ejemplo concreto: crear reply.

```text
ReplyBottomSheet/ReplyCard
  -> dispatch(createReply) en src/features/posts/store/postsSlice.ts
  -> requireSyncedAuthUser + ensureForumCanPublish + ensureUserCanCreateContent
  -> insert en public.replies via supabase.from('replies')
  -> incrementRepliesCount en topicsSlice
  -> UI actualiza arbol de replies
```

## 4. Estructura de carpetas

```text
.
|-- public/
|   |-- _redirects                  # fallback SPA para Netlify/static hosting
|   |-- agorashell.svg              # logo usado por MainLayout
|   `-- images/big_logo.svg         # logo grande usado en layout/loaders
|-- src/
|   |-- main.tsx                    # bootstrap React + Redux Provider
|   |-- App.tsx                     # hidratacion de auth y listener onAuthStateChange
|   |-- index.css                   # Tailwind v4, dark variant, prose, editor, overflow global
|   |-- routes/index.tsx            # rutas BrowserRouter
|   |-- layouts/MainLayout.tsx      # shell principal: sidebar, header, search, user menu
|   |-- store/
|   |   |-- index.ts                # configureStore y tipos RootState/AppDispatch
|   |   `-- confirmSlice.ts         # estado global del modal ConfirmModal
|   |-- services/
|   |   |-- supabase.ts             # createClient con env VITE_SUPABASE_*
|   |   |-- permissions.ts          # matriz de permisos por rol
|   |   |-- authGuard.ts            # valida usuario sincronizado con estado Redux
|   |   |-- forumLock.ts            # bloquea publicar si app_settings.foro_bloqueado
|   |   |-- userRestrictions.ts     # valida suspension/ban antes de publicar
|   |   `-- adminAudit.ts           # inserta admin_audit_logs
|   |-- hooks/                      # hooks transversales: dark mode, confirm, code, foro bloqueado
|   |-- components/                 # UI compartida: search, Spinner, RichTextEditor, ProtectedRoute
|   |-- contexts/                   # ScrollContext
|   |-- types/index.ts              # tipos manuales del dominio
|   `-- features/
|       |-- auth/                   # login/register/verify/settings/admin auth + authSlice
|       |-- forums/                 # home/feed/channels y cards de feed
|       |-- threads/                # canales, temas, detalle, replies UI, topic rules
|       |-- posts/                  # store de replies/reactions
|       |-- tags/                   # tags, TagInput, pagina de tag
|       |-- reports/                # reportes y panel de moderacion
|       |-- notifications/          # store/panel de notificaciones
|       |-- profile/                # perfil publico
|       |-- reputation/             # badge y helpers de reputacion
|       `-- adminAudit/             # panel/store de auditoria
|-- supabase/
|   |-- config.toml                 # config local Supabase CLI
|   |-- migrations/                 # migraciones versionadas
|   |-- mocks/                      # seed data realista; no schema base completo
|   `-- snippets/                   # SQL suelto no aplicado como migracion
|-- package.json
|-- package-lock.json
|-- tsconfig.json
|-- tsconfig.app.json
|-- tsconfig.node.json
|-- eslint.config.js
`-- vite.config.ts
```

## 5. Supabase

### Cliente y variables

- Cliente unico: `src/services/supabase.ts`.
- Variables requeridas: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- No hay `.env.example`; `.env` existe localmente pero no debe copiarse ni citar valores.
- El cliente activa `persistSession` y `autoRefreshToken` en auth.

### Esquema versionado en migraciones

Las migraciones viven en `supabase/migrations`. Importante: el repo actual no contiene una migracion inicial que cree todas las tablas core (`profiles`, `topics`, etc.); varias migraciones asumen que ya existen.

Tablas creadas por migraciones presentes:

- `public.reports` (`supabase/migrations/20260606060727_create_reports.sql`)
  - Columnas: `id`, `reporter_id`, `reported_user_id`, `target_type`, `target_topic_id`, `target_reply_id`, `target_user_id`, `reason`, `details`, `status`, `created_at`, `updated_at`.
  - Migracion posterior agrega `assigned_moderator_id`, `handled_by_id`, `handled_at`, `moderator_note` y amplie status con `in_review` (`20260606063053_moderation_queue_workflow.sql`).
  - Relaciones: `profiles`, `topics`, `replies`.
  - Indices: unicos parciales por reporter/target segun tipo; `reports_status_created_at_idx`; `reports_assigned_moderator_idx`.
- `public.admin_audit_logs` (`20260607234347_admin_audit_logs.sql`)
  - Columnas: `id`, `actor_id`, `actor_role`, `action`, `target_type`, `target_id`, `target_label`, `metadata`, `created_at`.
  - Indices: `created_at desc`, `actor_id`, `action`.
- `public.user_reputation_events` (`20260608005231_shell_reputation.sql`)
  - Columnas: `id`, `target_user_id`, `actor_id`, `action`, `points`, `source_type`, `source_id`, `created_at`, `metadata`.
  - Check de `action` para eventos de topic/reply/star/reaction.
  - Indices: unico `(source_type, source_id, action, target_user_id)` y target/created.
- `public.topic_rules` (`20260609203813_topic_rules.sql`)
  - Columnas: `id`, `topic_id`, `body`, `position`, `created_by`, `created_at`, `updated_at`.
  - Checks: `body` trim 1-240 chars; `position` 1-10.
  - Relaciones: `topics(id)` cascade; `profiles(id)` set null.
  - Indices: unico `(topic_id, position)`; indice `(topic_id, position)`.
  - Grants adicionales en `20260609211414_grant_topic_rules_access.sql`.

Tablas y views usadas por el frontend pero no creadas completamente en migraciones presentes:

- `profiles`, `roles`, `channels`, `topics`, `replies`, `topic_stars`, `reply_reactions`, `topic_tags`, `tags`, `notifications`, `app_settings`.
- Views `user_reputation_scores` y `user_reputation_badges` son creadas/reemplazadas en `20260608005231_shell_reputation.sql` y `20260608005647_shell_reputation_net_stats.sql`.
- Tipos manuales correspondientes viven en `src/types/index.ts`.

### RLS y policies versionadas

Policies confirmadas:

- `reports`
  - `reports_insert_authenticated`: authenticated puede insertar si `reporter_id = auth.uid()`.
  - `reports_select_owner_or_moderator`: reporter o perfil con `role_id in (1,2)` puede leer.
  - `reports_update_moderator`: solo admin/mod por `role_id in (1,2)` puede update.
  - Implicacion: queries de reportes para moderacion requieren usuario autenticado y perfil admin/mod; inserts deben mandar `reporter_id` del usuario actual.
- `admin_audit_logs`
  - Admin/mod pueden leer.
  - Admin/mod pueden insertar si `actor_id = auth.uid()`.
  - Implicacion: `src/services/adminAudit.ts` puede fallar y solo emite `console.warn`.
- `user_reputation_events`
  - `Reputation events are public read`: lectura publica.
  - Implicacion: views de reputacion pueden exponer puntajes publicos.
- `topic_rules`
  - Select publico.
  - Insert/update/delete solo authenticated cuyo perfil sea admin/mod (`role_id in (1,2)`) y no suspendido.
  - Implicacion: UI usa `can('close_topic')` como proxy para admin/mod en `CreateTopicModal.tsx` y `EditTopicModal.tsx`; base de datos refuerza con RLS.
- Policies restrictivas en inserts (`20260606040017_emergency_forum_lock.sql`, `20260606065355_user_suspensions.sql`)
  - `channels`, `topics`, `replies`, `tags` quedan restringidos por bloqueo global y por `user_can_create_content(auth.uid())`.
  - Implicacion: aunque la UI permita publicar, Supabase puede rechazar inserts si el foro esta bloqueado, el usuario esta suspendido o banned.
- `app_settings_update_admin`
  - Solo admin (`role_id = 1`) puede update de `app_settings` con `id = 1`.

⚠️ POR CONFIRMAR: RLS/policies de tablas core no incluidas en estas migraciones (`profiles`, `channels`, `topics`, `replies`, `tags`, etc.) porque no hay migracion inicial en el repo.

### Funciones, triggers y RPC

- RPC `get_topic_reply_threads_page(p_topic_id, p_limit, p_offset)` en `20260607192557_paginate_topic_reply_threads.sql`.
  - Devuelve roots paginados y todos sus descendientes usando CTE recursivo.
  - Usado por `fetchRepliesByTopic` y `fetchMoreRepliesByTopic` en `src/features/posts/store/postsSlice.ts`.
- RPC `get_reply_thread_by_reply_id(p_reply_id)` en la misma migracion.
  - Encuentra ancestros, root y thread completo.
  - Usado por `fetchReplyThreadById`.
- Triggers de reputacion en `20260608005231_shell_reputation.sql`.
  - Insert/delete en `topics`, `replies`, `topic_stars`, `reply_reactions` registran eventos.
- Trigger `prevent_self_reports_trigger` evita autoreportes en `reports`.
- Trigger `prevent_invalid_profile_moderation_trigger` valida bans/suspensiones y que admins no sean baneados/suspendidos por otros.

⚠️ POR CONFIRMAR: varias funciones son `security definer` en schema `public`; antes de cambiar permisos o exponer RPCs, revisar advisors de Supabase y grants reales.

### Storage

- RichTextEditor sube imagenes a bucket `images`: `src/components/shared/RichTextEditor.tsx`.
- Avatar upload usa bucket `avatars`: `src/features/auth/store/authSlice.ts`.
- `supabase/snippets/Untitled query 921.sql` crea bucket `images` y policies `images_select`, `images_insert`, `images_delete`, pero no esta en `supabase/migrations`.
- ⚠️ POR CONFIRMAR: bucket `avatars` y sus policies no estan versionados en el repo.
- ⚠️ POR CONFIRMAR: si el SQL de `snippets` se aplico en remoto/local; al no ser migracion, no queda garantizado por `supabase db reset`.

### Realtime

- `app_settings` se agrega a publication `supabase_realtime` en `20260606040017_emergency_forum_lock.sql`.
- Listener global de bloqueo: `src/hooks/useForoBloqueado.ts` escucha updates de `app_settings` `id=eq.1`.
- Replies realtime: `src/features/threads/hooks/useTopicDetail.ts` escucha `INSERT`, `DELETE`, `UPDATE` en `replies` filtradas por `topic_id`.
- Contador de replies en canal: `src/features/threads/hooks/useChannel.ts` escucha inserts de `replies` y reconsulta `topics.replies_count`.
- Notificaciones realtime: `src/features/notifications/components/NotificationPanel.tsx` escucha inserts de `notifications` por usuario.

### Migraciones

- Ubicacion: `supabase/migrations/*.sql`.
- Crear nueva migracion con CLI, no inventar nombres:

```bash
npx supabase migration new nombre_descriptivo
```

- Aplicacion local esperada:

```bash
npx supabase start
npx supabase db reset
npx supabase migration list --local
```

⚠️ POR CONFIRMAR: en esta maquina, Supabase local puede no estar corriendo; el puerto DB configurado es `54322` en `supabase/config.toml`.

### Tipos generados

Tipos generados por CLI remoto: `types.db.ts` en la raiz, creado con `npx supabase gen types typescript --linked > types.db.ts` el 2026-08-14. El archivo reporta `PostgrestVersion: "14.1"`.

Tipos manuales usados por la app: `src/types/index.ts`.

Comando para regenerar tipos remotos:

```bash
npx supabase gen types typescript --linked > types.db.ts
```

⚠️ POR CONFIRMAR: estrategia para integrar `types.db.ts` con `createClient<Database>()`; el cliente actual en `src/services/supabase.ts` no instancia `createClient<Database>()`.

### Auditoria CLI remota 2026-08-14

Proyecto linkeado: `lkvjvofvgdydvnymjluc` (`AgoraForum-db`), confirmado por `npx supabase projects list` y `supabase/.temp/project-ref`.

Comandos ejecutados y salida real:

- `npx supabase --version`
  - Salida: `2.76.12`.
  - Aviso: existe version nueva `v2.114.0`.
- `npx supabase projects list`
  - Proyecto linkeado marcado con `●`: org `irbwxaaoduonjekwlkuh`, ref `lkvjvofvgdydvnymjluc`, name `AgoraForum-db`, region `East US (North Virginia)`, created `2026-02-23 00:55:22`.
- `npx supabase link --project-ref lkvjvofvgdydvnymjluc --yes`
  - Salida: `Finished supabase link.`
  - Verificacion: `supabase/.temp/project-ref` contiene `lkvjvofvgdydvnymjluc`.
- `npx supabase migration list`
  - Local = remoto: `20260606040017`, `20260606040208`, `20260606060727`, `20260606063053`, `20260606065355`, `20260607183650`, `20260607192557`, `20260607234347`, `20260608000141`, `20260608005231`, `20260608005647`.
  - Drift critico: `20260609203813` y `20260609211414` existen localmente pero no aparecen en remoto.
- `npx supabase functions list`
  - Salida: tabla vacia con columnas `ID | NAME | SLUG | STATUS | VERSION | UPDATED_AT (UTC)`.
- `npx supabase db dump --schema public -f schema.sql`
  - Resultado: fallo; no se genero `schema.sql`.
  - Error final: `failed to connect as temp role ... failed SASL auth (FATAL: password authentication failed for user "cli_login_postgres" (SQLSTATE 28P01))`.
  - Mensaje final: `Connect to your database by setting the env var: SUPABASE_DB_PASSWORD`.
- `npx supabase db dump --data-only --schema public`
  - Resultado: fallo.
  - Error: `failed to inspect docker image ... open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.`
  - Mensaje: `Docker Desktop is a prerequisite for local development.`
- `npx supabase gen types typescript --linked > types.db.ts`
  - Resultado: exito.
  - Archivo generado: `types.db.ts`, 35968 bytes observados.
- `npx supabase db execute --help`
  - Resultado: esta CLI no tiene `db execute`; el help de `supabase db` lista `diff`, `dump`, `lint`, `pull`, `push`, `reset`, `start`.
- `npx supabase db query --help`
  - Resultado: esta CLI no tiene `db query`; el help lista los mismos subcomandos.
- `npx supabase inspect db table-stats`
  - Una ejecucion tuvo exito y listo tablas remotas: `public.replies`, `public.topics`, `public.reports`, `public.topic_stars`, `public.tags`, `public.admin_audit_logs`, `public.channels`, `public.user_reputation_events`, `public.profiles`, `public.topic_tags`, `public.roles`, `public.notifications`, `public.reply_reactions`, `public.app_settings`.
  - Una ejecucion posterior fallo con `failed SASL auth`; durante retries tambien aparecio `unexpected list bans status 502`.
- `npx supabase inspect db index-stats`
  - Resultado: exito.
  - Indices remotos listados: `public.replies_pkey`, `public.idx_replies_topic_id`, `public.topic_tags_pkey`, `public.idx_replies_parent_id`, `public.tags_pkey`, `public.topic_stars_pkey`, `public.profiles_pkey`, `public.tags_slug_key`, `public.admin_audit_logs_action_idx`, `public.roles_name_key`, `public.notifications_pkey`, `public.app_settings_pkey`, `public.user_reputation_events_pkey`, `public.notifications_user_id_read_created_at_idx`, `public.reply_reactions_pkey`, `public.profiles_username_lower_key`, `public.profiles_username_key`, `public.reports_assigned_moderator_idx`, `public.reply_reactions_reply_id_user_id_emoji_key`, `public.channels_pkey`, `public.admin_audit_logs_actor_id_idx`, `public.user_reputation_events_source_action_key`, `public.reports_pkey`, `public.user_reputation_events_target_created_idx`, `public.reports_status_created_at_idx`, `public.admin_audit_logs_pkey`, `public.reports_unique_reply_per_user`, `public.reports_unique_user_per_user`, `public.topic_stars_unique`, `public.roles_pkey`, `public.channels_slug_key`, `public.topic_stars_topic_id_user_id_key`, `public.tags_name_key`, `public.topics_pkey`, `public.admin_audit_logs_created_at_idx`, `public.reports_unique_topic_per_user`.
- `npx supabase --experimental storage ls ss:///avatars`
  - Resultado: exito.
  - Salida: `avatars/`.
- `npx supabase --experimental storage ls ss:///images`
  - Resultado: fallo por temp role.
  - Error final: `failed SASL auth ... Connect to your database by setting the env var: SUPABASE_DB_PASSWORD`.

Entidades remotas confirmadas por `types.db.ts` generado con `--linked`:

- Schema `public`, Tables: `admin_audit_logs`, `app_settings`, `channels`, `notifications`, `profiles`, `replies`, `reply_reactions`, `reports`, `roles`, `tags`, `topic_stars`, `topic_tags`, `topics`, `user_reputation_events`.
- Schema `public`, Views: `user_reputation_badges`, `user_reputation_scores`.
- Schema `public`, Functions: `get_reply_thread_by_reply_id`, `get_topic_reply_threads_page`, `record_reputation_event`, `user_can_create_content`.
- Schema `graphql_public`, Function: `graphql`.
- Enums: ninguno generado en `public`.

Catalogo no obtenido por CLI:

- No se pudo ejecutar SQL contra `information_schema.columns`, constraints, `pg_tables.rowsecurity`, `pg_policies`, triggers, `pg_proc`, `pg_indexes` ni enums porque `supabase db execute`/`db query` no existe en CLI `2.76.12`.
- `db dump` tampoco pudo producir DDL completo por fallo de credencial DB y pidio `SUPABASE_DB_PASSWORD`.
- Buckets de storage y sus policies completas no fueron listables con el CLI actual; solo se confirmo una respuesta exitosa para `ss:///avatars`.
- Tablas con realtime habilitado no fueron consultables por catalogo SQL; solo esta versionado en migracion local/remota que `app_settings` se agrega a `supabase_realtime`.

## 6. Funcionalidad a nivel de comportamiento

### Navegacion y layout

- Home `/` muestra feed principal por filtros (`best`, `hot`, `new`, `top`, `rising`) usando `src/features/forums/pages/HomePage.tsx` y `src/features/forums/store/feedSlice.ts`.
- `/channels` lista canales (`src/features/forums/pages/ForumsPage.tsx`).
- `/channels/:channelId` muestra temas del canal y tags disponibles (`src/features/threads/pages/ThreadsPage.tsx`, `src/features/threads/hooks/useChannel.ts`).
- `/channels/:channelId/topics/:topicId` muestra detalle de tema y replies (`ThreadDetailPage.tsx`).
- `/channels/topics/:topicId/thread/:replyId` muestra un thread de reply especifico (`ThreadPage.tsx`).
- `/tags/:slug`, `/hot`, `/search`, `/users/:username`, `/settings`, `/admin` existen en `src/routes/index.tsx`.
- `public/_redirects` permite que rutas SPA funcionen en hosting estatico.

### Auth y sesion

1. Al arrancar, `App.tsx` despacha `loadAuthUser()`.
2. `authSlice` llama `supabase.auth.getSession()`.
3. Si hay sesion, carga `profiles` con join opcional a `roles`.
4. `supabase.auth.onAuthStateChange` hidrata o limpia estado auth.
5. Login usa `signInWithPassword`; errores de email no confirmado se traducen a `EMAIL_NOT_CONFIRMED`.
6. Registro usa `signUp` con `emailRedirectTo` a `/auth/callback`.
7. Verificacion OTP usa `verifyOtp` en `VerifyEmailPage.tsx`.
8. Logout usa `supabase.auth.signOut()`.

Caso borde: `ProtectedRoute` existe (`src/components/shared/ProtectedRoute.tsx`) pero no esta conectado en `src/routes/index.tsx`; rutas sensibles deben validar permisos dentro de componentes/acciones.

### Roles y permisos

- La matriz vive en `src/services/permissions.ts`.
- Roles: `admin`, `moderator`, `user`, `banned`.
- `getEffectiveRole` trata suspension futura o rol banned como `banned`.
- Admin: crea canales, modera, cambia settings, bloquea foro.
- Moderator: revisa/resuelve reportes, borra contenido, cierra/pinea temas, suspende/banea usuarios no admin.
- User: crea temas/replies, reporta, reacciona, edita/borra propio contenido.
- Banned/suspendido: ve foro pero no crea/reacciona/reporta.

### Canales

1. Sidebar carga canales con `fetchChannels()` en `MainLayout.tsx`.
2. Crear canal abre modal local `CreateChannelModal` en `MainLayout.tsx`.
3. Solo usuarios con `can('create_channel')` ven accion.
4. El slug se genera en cliente desde el nombre.
5. `createChannel` valida `ensureForumCanPublish`, `ensureUserCanCreateContent`, permiso `create_channel`, luego inserta en `channels`.
6. Borrar canal se permite con `can('delete_channel')`; `forumsSlice` primero cuenta temas y rechaza si no esta vacio.

### Temas

1. En un canal, `useChannel` carga metadata de canal, tags y topics.
2. Crear tema requiere auth, `can('create_topic')`, foro no bloqueado, titulo y contenido no vacios (`CreateTopicModal.tsx`).
3. `createTopic` valida sesion sincronizada, lock global, restricciones de usuario; inserta `topics`, relaciona `topic_tags`, y opcionalmente `topic_rules`.
4. Editar tema lo hace el autor con `can('edit_own_content')`.
5. Cerrar/pinear tema requiere permisos `close_topic`/`pin_topic`.
6. Borrar tema puede hacerlo owner o mod/admin segun `delete_own_content`/`delete_any_content`.
7. Star topic usa `toggleStar` con `topic_stars`.
8. Tags por tema respetan `app_settings.max_tags_per_topic` via `tagsSlice`.

Caso borde confirmado: `threadsSlice.ts` carga `topic_rules` separado del query principal; si `topic_rules` no esta disponible, devuelve `[]` para evitar romper detalle de tema.

### Reglas por tema

- Editor: `src/features/threads/components/TopicRulesEditor.tsx`.
- Modal de reglas: `TopicRulesModal.tsx`.
- Reminder en replies: `TopicRulesReminder.tsx`.
- Reglas opcionales, maximo 10 por constraint DB y UI.
- Solo admins/mods pueden crear/editar reglas; UI usa `can('close_topic')` como proxy y DB refuerza con RLS sobre `topic_rules`.
- Al responder, se muestra recordatorio para seguir reglas; link abre modal con reglas.

### Replies y threads

1. `fetchRepliesByTopic` llama RPC `get_topic_reply_threads_page`.
2. Recibe ids/filas, reconsulta detalles con author/reactions y arma arbol con `buildTree`.
3. Crear reply requiere sesion sincronizada, foro no bloqueado, usuario no suspendido/banned.
4. Replies soportan `parent_id` para anidacion.
5. `max_reply_depth` viene de `app_settings` via `tagsSlice`.
6. Realtime inserta/actualiza/elimina replies en el arbol.
7. Reacciones por emoji se agrupan con `groupReactions`.

### Reportes y moderacion

- Reportes se crean desde `ReportModal`.
- `reportsSlice` evita autoreporte en cliente y DB tambien con trigger.
- Estados: `pending`, `in_review`, `reviewed`, `dismissed`.
- Moderadores/admins pueden reclamar, soltar, actualizar y resolver reportes.
- Resolver puede incluir borrar reply/topic o suspender/banear usuario segun permisos.
- Admin/mod actions pueden registrarse en `admin_audit_logs`.

### Bloqueo del foro

- `app_settings.foro_bloqueado` bloquea crear canales, temas y replies para no-admins.
- UI usa `useForoBloqueado`; DB agrega policies restrictivas.
- Admin puede cambiarlo desde `AdminPage.tsx` usando `app_settings`.

### Perfil, settings y reputacion

- Settings permite actualizar username/bio y avatar (`SettingsPage.tsx`, `authSlice.ts`).
- Username valida formato `[A-Za-z0-9_]{3,30}` en cliente y constraint en DB.
- Bio max 280 por DB.
- Reputacion se calcula desde `user_reputation_events` y views; componente `ReputationBadge.tsx`.
- Perfil publico consulta `profiles`, topics/replies recientes y views de reputacion (`UserProfilePage.tsx`).

## 7. Funcionalidad a nivel tecnico

### Contratos principales

- `src/types/index.ts`
  - Define `Profile`, `Channel`, `Tag`, `TopicRule`, `Topic`, `Reply`, `Notification`, `AppSettings`, `Report`.
  - Estos tipos son manuales; no derivan de Supabase.
- `src/services/supabase.ts`
  - Exporta `supabase` default/named.
  - Lanza error si faltan env vars.
- `src/services/permissions.ts`
  - Entrada: `Profile` parcial o `UserRole`.
  - Salida: boolean para `can(profile, action)` y `canModerateTarget`.
- `src/services/authGuard.ts`
  - Entrada: `RootState`.
  - Salida: usuario Supabase autenticado o throw si sesion cambio/no existe.
- `src/services/forumLock.ts`
  - Entrada: userId opcional.
  - Salida: void o throw si foro bloqueado y usuario no puede `toggle_forum_lock`.
- `src/services/userRestrictions.ts`
  - Entrada: userId.
  - Salida: void o throw si usuario no puede crear contenido.

### Slices Redux

- `authSlice`: sesion, user, profile, login/register/verify/logout/avatar/settings.
- `forumsSlice`: canales, crear/borrar canal.
- `feedSlice`: feed home con filtros y paginacion.
- `threadsSlice`: topics por canal, detalle, create/update/delete, pin/close/star, topic rules.
- `postsSlice`: replies, paginacion de roots, arbol de replies, create/update/delete, reactions.
- `tagsSlice`: tags y settings `max_tags_per_topic`, `max_reply_depth`.
- `reportsSlice`: workflow de reportes y acciones de moderacion.
- `notificationsSlice`: fetch y mark read.
- `adminAuditSlice`: fetch audit logs.
- `confirmSlice`: modal confirm compartido.

Patron replicable en thunks:

```ts
export const someAction = createAsyncThunk(
  'slice/action',
  async (payload, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.from('table').select('*')
      if (error) throw error
      return data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)
```

Nota: el repo usa mucho `any`; no introducir mas si se puede evitar, pero al tocar codigo existente conviene tipar de forma incremental.

### Loading/error

- Estados de carga viven en cada slice: `loading`, `loadingMore`, `error`, `loadMoreError`, `hasMore`.
- Para evitar race conditions, varios slices guardan `currentRequestId` y `currentMoreRequestId`.
- UI muestra `Spinner`, empty states y botones de reintento segun esos flags.

## 8. Convenciones del proyecto

- Nombres de carpetas por dominio en `src/features/<feature>`.
- Componentes React en PascalCase `.tsx`.
- Hooks empiezan con `use`.
- Slices Redux terminan en `Slice.ts`.
- Imports suelen ir: librerias externas, tipos/store, servicios, componentes locales.
- Estilos mayormente Tailwind inline en `className`; dark mode con clase `.dark` y variante declarada en `src/index.css`.
- No hay Prettier/formatter versionado.
- Errores de Supabase: patron comun `if (error) throw error` y `rejectWithValue(error.message)`.
- Confirmaciones destructivas usan `ConfirmModal` + `useConfirm`.
- Permisos UI deben usar `useRole().can(...)` o `services/permissions`.
- DB debe seguir RLS/policies; no confiar solo en UI.
- Commits/MR: por historial de trabajo del repo, usar rama nueva desde `development`, prefijo `codex/`, commit descriptivo y PR contra `development`. ⚠️ POR CONFIRMAR si existe una convencion formal escrita fuera del repo.

## 9. Setup local

### Requisitos

- Node/npm compatible con lockfile.
- Supabase CLI disponible via devDependency (`npx supabase ...`).
- Variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

No existe `.env.example`; crear `.env` local sin commitear secretos.

### Instalar y levantar frontend

```bash
npm install
npm run dev
```

El dev server usa puerto `6699` por `package.json`.

### Build/lint

```bash
npm run build
npm run lint
```

### Supabase local

```bash
npx supabase start
npx supabase db reset
npx supabase migration list --local
```

⚠️ POR CONFIRMAR: `supabase/config.toml` apunta auth local a `http://127.0.0.1:3000`, pero Vite usa `6699`; revisar redirects permitidos si se usa auth local.

## 10. Reglas para agentes de IA

Si hacer cambios:

- Empezar desde `development`, crear rama nueva `codex/<descripcion>` y PR/MR contra `development`, salvo instruccion contraria del usuario.
- Leer archivos existentes antes de editar; preferir patrones del feature afectado.
- No tocar `.env`, no imprimir secretos, no copiar valores de env.
- No asumir schema remoto de Supabase si no esta en migraciones; marcar `⚠️ POR CONFIRMAR`.
- Para cambios Supabase:
  - Crear migracion con `npx supabase migration new <name>`.
  - Habilitar/revisar RLS para tablas expuestas.
  - Verificar grants si una tabla nueva debe usarse desde cliente.
  - Revisar funciones `security definer` con cuidado.
- No editar SQL en `supabase/snippets` como si fuera migracion aplicada.
- No depender solo de permisos UI; reforzar en DB o servicios cuando aplique.
- No introducir service role keys ni secret keys en frontend.
- No revertir cambios ajenos en worktree.
- Mantener cambios scopeados al bug/feature.
- Para UI, revisar mobile y dark mode; `src/index.css` ya contiene reglas globales contra overflow horizontal.

Verificaciones obligatorias antes de proponer merge:

```bash
npm run build
npm run lint
```

Adicionales cuando aplique:

```bash
npx supabase migration list --local
npx supabase db reset
```

⚠️ POR CONFIRMAR: no hay test suite automatizada; si se agrega, documentar scripts aqui.

Archivos sensibles o de alto impacto:

- `src/services/supabase.ts`: env/client auth.
- `src/services/permissions.ts`: autorizacion de UI/servicios.
- `src/routes/index.tsx`: exposicion de rutas.
- `src/store/index.ts`: shape global de Redux.
- `src/types/index.ts`: contratos manuales del dominio.
- `supabase/migrations/*.sql`: schema, RLS, triggers.
- `src/features/posts/store/postsSlice.ts` y `src/features/threads/store/threadsSlice.ts`: flujo core de conversacion.

## 11. Estado actual

### Implementado

- SPA React/Vite con dark mode y layout responsive.
- Auth email/password, registro, OTP/verificacion, callback y logout.
- Canales, temas, tags y feed home.
- Detalle de tema, replies anidados, reactions y realtime de replies.
- Reglas opcionales por tema para admin/mod.
- Reportes y panel de moderacion/admin.
- Bloqueo global del foro.
- Suspensiones/bans a nivel de permisos y DB.
- Reputacion por eventos y views.
- Notificaciones y panel realtime.
- Avatar upload y rich text image upload.

### En progreso o parcialmente versionado

- Supabase schema base: tablas core usadas por la app no estan creadas en migraciones presentes.
- Storage: bucket `images` esta en snippet; `avatars` no esta versionado.
- Tipos Supabase generados: existe `types.db.ts` en raiz, pero aun no esta integrado al cliente `src/services/supabase.ts`.
- `ProtectedRoute`: existe pero no protege rutas en router actual.
- Drift remoto critico: `topic_rules` (`20260609203813`) y sus grants (`20260609211414`) existen localmente pero no estan aplicados en remoto segun `npx supabase migration list`.

### Pendiente / bugs conocidos visibles

- README no describe el producto; sigue siendo template base de Vite.
- Falta `.env.example`.
- No hay tests automatizados ni CI versionado en `.github`.
- Uso amplio de `any` en stores/componentes.
- `MainLayout.tsx` concentra modal de crear canal y mucha logica de navegacion.
- Mismatch potencial entre puerto Vite `6699` y Supabase auth local `3000`.
- Views de reputacion no declaran `security_invoker`; revisar seguridad con advisors antes de ampliar permisos.
- `avatars` storage puede fallar si bucket/policies no existen en el entorno.

## 12. Glosario

- Canal: agrupador de temas, equivalente a comunidad/categoria. Tipo `Channel`.
- Tema: publicacion principal dentro de un canal. Tipo `Topic`.
- Reply/respuesta: comentario dentro de un tema, puede tener `parent_id` para anidarse. Tipo `Reply`.
- Thread de reply: subarbol de respuestas bajo una respuesta root; cargado con RPC recursiva.
- Tag: etiqueta asociable a temas por `topic_tags`.
- Star: favorito/like de tema en `topic_stars`; suma reputacion al autor.
- Reaction: emoji sobre reply en `reply_reactions`; suma reputacion al autor.
- Topic rules/reglas del tema: reglas opcionales por tema en `topic_rules`.
- Foro bloqueado: flag `app_settings.foro_bloqueado` que impide publicar a no-admins.
- Admin: rol con `role_id = 1`, permisos completos.
- Moderator/mod: rol con `role_id = 2`, modera reportes/contenido sin administrar settings globales.
- Banned: rol efectivo sin permisos de creacion/reaccion/reporte.
- Shell score: puntaje de reputacion calculado desde `user_reputation_events`.
- Audit log: registro de acciones administrativas en `admin_audit_logs`.

## ⚠️ POR CONFIRMAR

- DDL completo remoto de Supabase: `db dump --schema public -f schema.sql` fallo por temp role/SASL y pidio `SUPABASE_DB_PASSWORD`.
- RLS/policies reales de esas tablas core en remoto.
- Buckets y policies reales de storage: `ss:///avatars` respondio, pero policies completas y `images` no quedaron confirmados por CLI.
- Si `supabase/snippets/Untitled query 921.sql` fue aplicado en algun entorno.
- Config real de Auth redirects en Supabase remoto.
- Estrategia final para integrar `types.db.ts` con `createClient<Database>()`.
- CI/CD externo: no hay `.github`, pero podria existir Netlify u otra configuracion fuera del repo.
- Convencion formal de commits/MR fuera de lo observado en el flujo de trabajo.
