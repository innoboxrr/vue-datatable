<template>

    <section :class="[theme.datatable, cardWrapper ? theme.surface : null]">

        <!-- Con filas seleccionadas, la barra dice cuántas y qué hacer con ellas,
             en el mismo sitio que la de siempre para que la tabla no salte. -->
        <div
            v-if="bulkVisible"
            :class="theme.bulkBar"
            role="region"
            :aria-label="text.selection">
            <span :class="theme.bulkCount" aria-live="polite">{{ selectedIds.length }} {{ text.selected }}</span>
            <button
                v-for="action in bulkActions"
                :key="action.id ?? action.name"
                type="button"
                :class="[action.danger ? theme.buttonDanger : theme.buttonSecondary, 'fe-button-sm']"
                @click="runBulk(action)">
                <IconComponent v-if="action.icon" :name="action.icon" :size="14" />
                <span>{{ action.name }}</span>
            </button>
            <span :class="theme.toolbarSpacer" />
            <button type="button" :class="theme.buttonLink" @click="clearSelection">{{ text.clearSelection }}</button>
        </div>

        <div v-else-if="showTopbar" :class="theme.toolbar">
            <MenuComponent
                v-if="hasActions"
                :items="crudItems"
                :label="text.actions"
                placement="bottom-start"
                :before-open="prepareCrud">
                <template #trigger="{ toggle, loading: busy, triggerProps }">
                    <button
                        type="button"
                        :class="theme.buttonSecondary"
                        v-bind="triggerProps"
                        :disabled="busy"
                        @click="toggle">
                        <IconComponent name="actions" :size="14" />
                        <span>{{ text.actions }}</span>
                    </button>
                </template>
            </MenuComponent>

            <span :class="theme.toolbarSpacer" />

            <button type="button" :class="theme.iconButton" :aria-label="text.refresh" @click="refresh">
                <IconComponent name="refresh" :size="16" />
            </button>

            <button
                v-if="hasFilter"
                type="button"
                :class="theme.iconButton"
                :aria-label="text.filters"
                :aria-expanded="filtersOpen ? 'true' : 'false'"
                :aria-controls="filtersId"
                @click="filtersOpen = ! filtersOpen">
                <IconComponent name="filter" :size="16" />
            </button>
        </div>

        <!-- Abrir el panel es estado del componente. Antes lo hacía uk-toggle
             buscando `.filter-form` por selector, y Vue y React acabaron
             comportándose distinto. -->
        <div
            v-if="showTopbar && hasFilter"
            :id="filtersId"
            :class="['filter-form', theme.datatableFilters]"
            :hidden="! filtersOpen">
            <slot name="filterForm"></slot>
        </div>

        <DataTableComponent
            :table="table"
            :head="visibleHead"
            :rows="rows"
            :clones="clones"
            :loading="loading"
            :error="error"
            :actions="hasActions"
            :selectable="selectable"
            :show-table-header="showTableHeader"
            :data-table-components="dataTableComponents"
            :labels="text"
            :order-by="orderBy"
            :sort="sort"
            :items-for="rowItems"
            :prepare-row="preparePolicies"
            @sort-column="sortColumn"
            @retry="refresh" />

        <!-- Con un error y sin filas, un «No hay resultados» en el pie
             contradiría el motivo que ya da la tabla. -->
        <SelectPaginationComponent
            v-if="! (error && rows.length === 0)"
            :meta="meta"
            :links="links"
            :labels="text"
            @update-page="updatePage" />

    </section>

</template>

<script setup>

    /**
     * Un listado sobre el contrato del modelo: `crudActions()`,
     * `dataTableHead()`, `dataTableSort()`, `setFilters()` y, si las hay,
     * `bulkActions()` y `dataTableComponents()`.
     *
     * El modelo es el mismo archivo para Vue y para React, y esta tabla recibe
     * exactamente los mismos props que su gemela.
     */

    import { computed, inject, markRaw, ref, useId } from 'vue'
    import { routerKey } from 'vue-router'
    import IconComponent from 'innoboxrr-form-elements/src/IconComponent.vue'
    import MenuComponent from 'innoboxrr-form-elements/src/MenuComponent.vue'

    import DataTableComponent from './components/DataTableComponent.vue'
    import SelectPaginationComponent from './components/SelectPaginationComponent.vue'
    import useDataTable from './useDataTable.js'
    import useTheme from './useTheme.js'
    import { DEFAULT_LABELS, menuItems } from './table.js'

    const props = defineProps({
        dataUrl: {
            type: String,
            required: true,
        },
        dataMethod: {
            type: String,
            default: 'post',
        },
        model: {
            type: Object,
            required: true,
        },
        policyUrl: {
            type: String,
            required: true,
        },
        policyMethod: {
            type: String,
            default: 'post',
        },
        showTopbar: {
            type: Boolean,
            default: true,
        },
        hasActions: {
            type: Boolean,
            default: true,
        },
        hasFilter: {
            type: Boolean,
            default: true,
        },
        // Vue 3 exige factoría en los defaults de objeto y array.
        formFilters: {
            type: Object,
            default: () => ({}),
        },
        externalFilters: {
            type: Object,
            default: () => ({}),
        },
        extraParams: {
            type: Object,
            default: () => ({}),
        },
        extraQuery: {
            type: Object,
            default: () => ({}),
        },
        hideColumns: {
            type: Array,
            default: () => [],
        },
        cardWrapper: {
            type: Boolean,
            default: true,
        },
        showTableHeader: {
            type: Boolean,
            default: true,
        },
        // Casillas para elegir filas y la barra de acciones masivas.
        selectable: {
            type: Boolean,
            default: false,
        },
        // Los textos de la tabla; se mezclan con los de fábrica.
        labels: {
            type: Object,
            default: () => ({}),
        },
    })

    // Sin router montado no hay a dónde navegar, pero la tabla se puede
    // pintar igual: inject con valor por defecto no avisa.
    const router = inject(routerKey, null)

    const navigate = (target) => router?.push(target)

    const theme = useTheme()

    const text = computed(() => ({ ...DEFAULT_LABELS, ...props.labels }))

    const filtersOpen = ref(false)
    const filtersId = useId()

    const {
        table,
        visibleHead,
        rows,
        clones,
        meta,
        links,
        loading,
        error,
        sort,
        orderBy,
        crudActions,
        bulkActions,
        rowActions,
        selectedIds,
        dataTable,
        pagination,
        refresh,
        clearSelection,
        sortColumn,
        updatePage,
        preparePolicies,
        run,
        runBulk,
    } = useDataTable(props, { navigate: router ? navigate : null, labels: text })

    const dataTableComponents = typeof props.model.dataTableComponents === 'function'
        ? Object.fromEntries(Object.entries(props.model.dataTableComponents()).map(([key, component]) => [key, markRaw(component)]))
        : {}

    const bulkVisible = computed(() => props.selectable && selectedIds.value.length > 0)

    const crudItems = computed(() => menuItems(crudActions.value, text.value, run))

    const rowItems = (row) => menuItems(rowActions(row), text.value, run)

    const prepareCrud = () => preparePolicies(null)

    defineExpose({ refresh, clearSelection, table, selectedIds, crudActions, dataTable, pagination })

</script>
