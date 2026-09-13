<template>

    <div :class="theme.tableContainer">

        <table :class="[theme.table, theme.tableSticky]" :aria-busy="loading ? 'true' : 'false'">

            <thead v-if="showTableHeader">
                <tr>
                    <th v-if="selectable" scope="col" :class="theme.tableSelect">
                        <input
                            type="checkbox"
                            :class="theme.checkbox"
                            :aria-label="labels.selectAll"
                            :checked="allSelected"
                            :indeterminate="someSelected"
                            :disabled="rows.length === 0"
                            @change="table.toggleAllPageRowsSelected($event.target.checked)">
                    </th>

                    <th
                        v-for="column in head"
                        :id="`th_${column.id}`"
                        :key="column.id"
                        scope="col"
                        :class="column.numeric ? theme.tableNumeric : null"
                        :aria-sort="ariaSort(column, orderBy, sort)">
                        <button
                            v-if="column.sortable === true"
                            type="button"
                            :class="theme.tableSort"
                            @click="emit('sortColumn', column)">
                            <span>{{ column.value }}</span>
                            <IconComponent :name="sortIcon(column, orderBy, sort)" :size="12" />
                        </button>
                        <template v-else>{{ column.value }}</template>
                    </th>

                    <th v-if="actions" scope="col" :class="theme.tableSelect" :aria-label="labels.actions" />
                </tr>
            </thead>

            <tbody>

                <!-- Primera carga: la forma de las filas, mientras llegan. -->
                <template v-if="loading && rows.length === 0">
                    <tr v-for="n in SKELETON_ROWS" :key="`skeleton-${n}`" data-skeleton="true">
                        <td v-if="selectable" :class="theme.tableSelect" />
                        <td v-for="column in head" :key="column.id">
                            <SkeletonComponent />
                        </td>
                        <td v-if="actions" :class="theme.tableSelect" />
                    </tr>
                </template>

                <!-- Sin filas se dice por qué: no es lo mismo vacío que prohibido. -->
                <tr v-else-if="rows.length === 0">
                    <td :colspan="colspan" :class="theme.tableEmpty">
                        <template v-if="error">
                            <span role="alert">{{ error.message }}</span>
                            <button
                                v-if="error.retryable"
                                type="button"
                                :class="theme.buttonLink"
                                @click="emit('retry')">{{ labels.retry }}</button>
                        </template>
                        <template v-else>{{ labels.empty }}</template>
                    </td>
                </tr>

                <template v-else>
                    <tr
                        v-for="row in table.getRowModel().rows"
                        :key="row.id"
                        :data-selected="row.getIsSelected() ? 'true' : undefined">

                        <td v-if="selectable" :class="theme.tableSelect">
                            <input
                                type="checkbox"
                                :class="theme.checkbox"
                                :aria-label="`${labels.selectRow} ${row.original.id}`"
                                :checked="row.getIsSelected()"
                                @click="row.getToggleSelectedHandler()($event)">
                        </td>

                        <td
                            v-for="cell in row.getVisibleCells()"
                            :key="cell.id"
                            :class="headOf(cell).numeric ? theme.tableNumeric : null">
                            <component
                                :is="componentFor(cell)"
                                v-if="componentFor(cell)"
                                v-bind="componentProps(valueFor(cell, row))"
                                @callback="onCallback(cell, row, $event)" />
                            <span v-else-if="headOf(cell).html" v-html="valueFor(cell, row)" />
                            <template v-else>{{ valueFor(cell, row) }}</template>
                        </td>

                        <td v-if="actions" :class="theme.tableSelect">
                            <MenuComponent
                                :items="itemsFor(row.original)"
                                :label="`${labels.rowActions} ${row.original.id}`"
                                :before-open="() => prepareRow(row.original.id)" />
                        </td>

                    </tr>
                </template>

            </tbody>

        </table>

    </div>

</template>

<script setup>

    /**
     * La tabla propiamente dicha, sobre una instancia de TanStack Table.
     *
     * El menú de cada fila espera a conocer los permisos antes de abrirse.
     * Antes se abría al instante con todo deshabilitado y se habilitaba cuando
     * llegaba la respuesta —si llegaba: un fallo se reintentaba en silencio—,
     * y el usuario veía parpadear lo que no podía hacer.
     */

    import { computed } from 'vue'
    import IconComponent from 'innoboxrr-form-elements/src/IconComponent.vue'
    import MenuComponent from 'innoboxrr-form-elements/src/MenuComponent.vue'
    import SkeletonComponent from 'innoboxrr-form-elements/src/SkeletonComponent.vue'

    import useTheme from '../useTheme.js'
    import { DEFAULT_LABELS, ariaSort, cellValue, componentProps, sortIcon } from '../table.js'

    const SKELETON_ROWS = 5

    const props = defineProps({
        table: {
            type: Object,
            required: true,
        },
        head: {
            type: Array,
            default: () => [],
        },
        rows: {
            type: Array,
            default: () => [],
        },
        clones: {
            type: Array,
            default: () => [],
        },
        loading: {
            type: Boolean,
            default: false,
        },
        error: {
            type: Object,
            default: null,
        },
        actions: {
            type: Boolean,
            default: false,
        },
        selectable: {
            type: Boolean,
            default: false,
        },
        showTableHeader: {
            type: Boolean,
            default: true,
        },
        dataTableComponents: {
            type: Object,
            default: () => ({}),
        },
        labels: {
            type: Object,
            default: () => DEFAULT_LABELS,
        },
        orderBy: {
            type: String,
            default: null,
        },
        sort: {
            type: Object,
            default: () => ({}),
        },
        itemsFor: {
            type: Function,
            default: () => [],
        },
        prepareRow: {
            type: Function,
            default: async () => {},
        },
    })

    const emit = defineEmits(['sortColumn', 'retry'])

    const theme = useTheme()

    const colspan = computed(() => props.head.length + (props.selectable ? 1 : 0) + (props.actions ? 1 : 0))

    const allSelected = computed(() => props.rows.length > 0 && props.table.getIsAllPageRowsSelected())
    const someSelected = computed(() => props.table.getIsSomePageRowsSelected() && ! allSelected.value)

    const headOf = (cell) => cell.column.columnDef.meta?.head ?? {}

    const componentFor = (cell) => {
        const name = headOf(cell).component

        return name ? (props.dataTableComponents[name] ?? null) : null
    }

    const valueFor = (cell, row) => cellValue(headOf(cell), props.clones[row.index] ?? row.original)

    const onCallback = (cell, row, payload) => {
        const callback = headOf(cell).callback

        return typeof callback === 'function' ? callback(payload, row.original) : null
    }

</script>
