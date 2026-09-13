# innoboxrr-vue-datatable

Un listado de administración para Vue 3 sobre el contrato de modelo de
LaraPack: barra de acciones, filtros, orden y paginación en el servidor,
selección de filas con acciones masivas, permisos resueltos antes de abrir cada
menú, esqueletos mientras carga y errores que se ven.

Por debajo, [TanStack Table](https://tanstack.com/table) lleva el estado de la
tabla —columnas visibles, orden, selección— y los componentes de
`innoboxrr-form-elements` ponen el menú, los iconos y los esqueletos, con el
tema de `innoboxrr-form-core`.

Su gemelo es [`innoboxrr-react-datatable`](../react-datatable): los mismos
props, el mismo modelo, el mismo comportamiento.

## Instalación

```
npm i innoboxrr-vue-datatable innoboxrr-form-core innoboxrr-form-elements vue-router
```

```js
import 'innoboxrr-form-core/styles'
```

## Uso

```vue
<template>
    <DataTable
        ref="table"
        :data-url="route('api.acme.shop.product.index')"
        data-method="get"
        :policy-url="route('api.acme.shop.product.policies')"
        policy-method="get"
        :model="model"
        :form-filters="filters"
        selectable>
        <template #filterForm>
            <FilterForm @submit="filters = $event" />
        </template>
    </DataTable>

    <!-- Una vez en la aplicación, para los avisos y las confirmaciones. -->
    <ToastRegionComponent />
    <ConfirmHostComponent />
</template>

<script setup>
    import { ref } from 'vue'
    import DataTable from 'innoboxrr-vue-datatable'
    import * as model from './models/product'

    const table = ref(null)
    const filters = ref({})

    // Tras crear o editar en un drawer: table.value.refresh()
</script>
```

## Props

| Prop | Por defecto | |
|---|---|---|
| `dataUrl`, `policyUrl` | — | Obligatorias. |
| `dataMethod`, `policyMethod` | `'post'` | `get` manda `params`; `post`, `data`. |
| `model` | — | El contrato del modelo (abajo). |
| `formFilters` | `{}` | Un cambio vuelve a la primera página. |
| `externalFilters` | `{}` | Un cambio recarga sin cambiar de página. |
| `extraParams`, `extraQuery` | `{}` | Se suman a las rutas de las acciones. |
| `hideColumns` | `[]` | Ids, como `'name'` o `{ id: 'name' }`. |
| `selectable` | `false` | Casillas y barra de acciones masivas. |
| `showTopbar`, `hasActions`, `hasFilter`, `showTableHeader`, `cardWrapper` | `true` | |
| `labels` | `{}` | Textos; se mezclan con `DEFAULT_LABELS`. |

Por `ref`: `refresh()`, `clearSelection()`, `selectedIds` y la instancia de
TanStack Table en `table`.

## El contrato del modelo

Es **el mismo archivo** para Vue y para React: funciones puras y llamadas HTTP.

```js
export const crudActions = () => [
    { id: 'create', name: 'Crear', icon: 'plus', route: true, policy: false,
      params: { to: { name: 'AdminCreateProduct', params: {} } } },
    { id: 'export', name: 'Exportar', icon: 'download', route: false, policy: false,
      callback: 'exportModel', params: {}, success: 'Exportación en cola' },
]

export const dataTableHead = () => [
    { id: 'id', value: 'ID', sortable: true, numeric: true },
    { id: 'price', value: 'Precio', sortable: true, numeric: true, parser: (value, row) => `$${value}` },
    { id: 'status', value: 'Estado', html: true, parser: (value) => `<b>${value}</b>` },
    { id: 'link', value: 'Enlace', component: 'CopyLink', callback: (payload, row) => {} },
]

export const dataTableSort = () => ({ id: 'asc' })
export const setFilters = (filters) => filters

// Opcionales
export const dataTableComponents = () => ({ CopyLink })
export const bulkActions = () => [
    { id: 'delete', name: 'Borrar', icon: 'delete', callback: 'bulkDelete', danger: true },
]
export const bulkDelete = (ids, rows) => { /* … */ }
```

- **Acciones.** `route: true` navega a `params.to` con vue-router;
  `route: true, link: true` abre `params.link`; `route: false` llama a
  `model[callback](params)` y recarga. Cada fila trae las suyas en `actions`.
- **Permisos.** Antes de abrir un menú se pregunta a `policyUrl` con el `id` de
  la fila (o `null` para la barra) y se espera la respuesta: un
  `{ edit: true }` habilita esa acción. Lo que no está permitido se ve
  deshabilitado y dice por qué. La respuesta se guarda hasta la próxima carga.
- **Parsers.** Reciben una copia de la fila: mutarla no cambia los datos.
- **Acciones masivas.** Reciben los ids seleccionados —también los de otras
  páginas— y las filas cargadas que están entre ellos.
- **Confirmaciones.** Si un callback rechaza con un `RequestCancelledError`
  (lo que lanza `innoboxrr-http-request` cuando se cancela la confirmación), la
  tabla no avisa ni recarga.

## Qué se ve

- **Cargando.** La primera carga pinta la forma de las filas; las siguientes
  atenúan las que hay (`aria-busy`).
- **Errores.** Sin filas, el motivo va en la tabla: «No tienes permiso» para un
  403, y «Reintentar» para lo demás. Con filas en pantalla, un aviso. No hay
  reintentos silenciosos.
- **Orden.** Un botón en cada cabecera ordenable, con `aria-sort`.
- **Una petición por cambio.** Un filtro nuevo en la página 3 es una sola
  petición a la página 1, y una respuesta que llega tarde no pisa a la última.

## `useDataTable`

La lógica, sin la vista:

```js
import { useDataTable } from 'innoboxrr-vue-datatable'

const { table, rows, meta, loading, error, sortColumn, updatePage, refresh } = useDataTable(props, { navigate, labels })
```

## De 2.x a 3.0

- Ya no existen `NavDropdownComponent`, `IconRouteComponent`,
  `IconLinkComponent`, `DisabledLinkComponent` ni `PaginationComponent`: el menú
  es `MenuComponent` de `innoboxrr-form-elements`.
- Las acciones de ruta se ejecutan desde el menú con `router.push`, no con un
  `<router-link>`.
- Los textos están en español y se cambian con `labels`.
- Un fallo ya no se reintenta tres veces: se ve, y se reintenta a mano.
- `innoboxrr-form-elements` pasa a ser dependencia par, y `innoboxrr-form-core`
  sube a `^2.6`, que trae las clases del listado.

## Pruebas

```
npm test
```
