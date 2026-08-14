# README

**Ruta:** `src/features/threads/components`
**Tipo:** presentacional
**Estado:** estable

## Qué hace
Agrupa componentes presentacionales simples de esta carpeta. Estos archivos no consultan datos remotos directamente y delegan acciones al componente padre.

## Componentes incluidos
- `TopicRulesReminder` (`src/features/threads/components/TopicRulesReminder.tsx`): componente presentacional o control sin consumo directo de datos.
- `TopicRulesModal` (`src/features/threads/components/TopicRulesModal.tsx`): componente presentacional o control sin consumo directo de datos.
- `TopicRulesEditor` (`src/features/threads/components/TopicRulesEditor.tsx`): componente presentacional o control sin consumo directo de datos.
- `ImageCarousel` (`src/features/threads/components/ImageCarousel.tsx`): componente presentacional o control sin consumo directo de datos.

## Datos
- Origen: props o render local.
- Tabla(s) y RLS: no aplica directamente.

## Reglas
Si alguno de estos componentes empieza a manejar estado, efectos o Supabase, crear un `.md` propio con la plantilla completa.