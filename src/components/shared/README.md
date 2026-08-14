# README

**Ruta:** `src/components/shared`
**Tipo:** presentacional
**Estado:** estable

## Qué hace
Agrupa componentes presentacionales simples de esta carpeta. Estos archivos no consultan datos remotos directamente y delegan acciones al componente padre.

## Componentes incluidos
- `Spinner` (`src/components/shared/Spinner.tsx`): componente presentacional o control sin consumo directo de datos.
- `UserLink` (`src/components/shared/UserLink.tsx`): componente presentacional o control sin consumo directo de datos.

## Datos
- Origen: props o render local.
- Tabla(s) y RLS: no aplica directamente.

## Reglas
Si alguno de estos componentes empieza a manejar estado, efectos o Supabase, crear un `.md` propio con la plantilla completa.