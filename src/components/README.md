# README

**Ruta:** `src/components`
**Tipo:** presentacional
**Estado:** estable

## Qué hace
Agrupa componentes presentacionales simples de esta carpeta. Estos archivos no consultan datos remotos directamente y delegan acciones al componente padre.

## Componentes incluidos
- `ComingSoon` (`src/components/ComingSoon.tsx`): componente presentacional o control sin consumo directo de datos.

## Datos
- Origen: props o render local.
- Tabla(s) y RLS: no aplica directamente.

## Reglas
Si alguno de estos componentes empieza a manejar estado, efectos o Supabase, crear un `.md` propio con la plantilla completa.