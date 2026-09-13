/**
 * El export por defecto es la tabla, igual que en innoboxrr-react-datatable.
 * Se exponen además la lógica, por si alguien quiere pintarla de otra forma,
 * y las piezas con las que está hecha.
 */

import DataTable from './src/DataTable.vue'

export default DataTable

export { default as useDataTable } from './src/useDataTable.js'
export { default as DataTableComponent } from './src/components/DataTableComponent.vue'
export { default as SelectPaginationComponent } from './src/components/SelectPaginationComponent.vue'
export { DEFAULT_LABELS } from './src/table.js'
