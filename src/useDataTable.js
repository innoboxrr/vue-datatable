import { computed, onMounted, ref, shallowRef, unref, watch } from 'vue'
import axios from 'axios'
import {
    columnVisibilityFeature,
    rowSelectionFeature,
    rowSortingFeature,
    tableFeatures,
    useTable,
} from '@tanstack/vue-table'
import { notifyError, notifySuccess } from 'innoboxrr-form-core'

import * as core from './table.js'

/**
 * Solo lo que la tabla usa. El orden y la paginación los hace el servidor, así
 * que no hay modelos de filas ordenadas ni paginadas: TanStack Table lleva el
 * estado —qué columnas se ven, qué filas están seleccionadas, por qué columna
 * se ordena— y la tabla pinta.
 */
const features = tableFeatures({ rowSortingFeature, columnVisibilityFeature, rowSelectionFeature })

/**
 * Toda la lógica de la tabla: cargar, ordenar, paginar, seleccionar y resolver
 * permisos. Es la misma que `useDataTable` de innoboxrr-react-datatable.
 *
 * Está fuera del componente para poder probarla y para pintar la misma tabla
 * de otra forma.
 *
 * @param {object} props  los props de DataTable (reactivos)
 * @param {{ navigate?: (target: object) => unknown, labels?: object }} options
 */
export default function useDataTable(props, { navigate = null, labels = core.DEFAULT_LABELS } = {}) {
    const text = () => unref(labels)

    const head = computed(() => props.model.dataTableHead())
    const columns = computed(() => core.columnsFrom(head.value))

    const visibleHead = computed(() => {
        const hidden = core.hiddenColumnIds(props.hideColumns)

        return head.value.filter((column) => ! hidden.includes(column.id))
    })

    // Las filas llegan del servidor y se sustituyen enteras: una referencia
    // superficial evita que Vue envuelva cada una en un proxy.
    const rows = shallowRef([])
    const meta = shallowRef({})
    const links = shallowRef([])
    const loading = ref(false)
    const error = shallowRef(null)

    const sort = ref({ ...props.model.dataTableSort() })
    const orderBy = ref('id')
    const page = ref(1)

    /** Lo que respondió el backend de permisos, por fila y para la barra. */
    const allowed = shallowRef({})

    // A partir del primer clic en una cabecera, el orden del usuario manda
    // sobre el que traigan los filtros externos.
    let internalSort = false
    let requestId = 0

    const table = useTable({
        features,
        columns,
        data: rows,
        getRowId: (row, index) => String(row?.id ?? index),
        manualSorting: true,
        enableRowSelection: computed(() => props.selectable === true),
        isRowRangeSelectionEvent: core.isRangeEvent,
        state: computed(() => ({
            columnVisibility: core.visibilityFrom(props.hideColumns),
            sorting: core.sortingFrom(orderBy.value, sort.value),
        })),
    })

    const selection = computed(() => table.atoms.rowSelection.get() ?? {})
    const selectedIds = computed(() => Object.keys(selection.value).filter((id) => selection.value[id]))

    /**
     * Una copia por fila y carga, para que un parser del modelo no pueda mutar
     * los datos de la tabla.
     */
    const clones = computed(() => rows.value.map(core.cloneRow))

    const crudActions = computed(() => core.withPolicies(
        props.model.crudActions(),
        allowed.value[core.CRUD_POLICIES]
    ))

    const bulkActions = computed(() => (
        typeof props.model.bulkActions === 'function' ? props.model.bulkActions() : []
    ))

    const rowActions = (row) => core.withPolicies(row?.actions ?? [], allowed.value[String(row?.id)])

    const load = async () => {
        const id = ++requestId

        const filters = core.requestFilters({
            formFilters: props.formFilters,
            externalFilters: props.externalFilters,
            orderBy: orderBy.value,
            sort: sort.value,
            page: page.value,
            internalSort,
        })

        props.model.setFilters?.(filters)
        loading.value = true

        try {
            const response = await axios(core.requestConfig(props.dataMethod, props.dataUrl, filters))

            // Una respuesta que llega tarde no pisa a la de una petición
            // posterior: quien cambia de página dos veces seguidas ve la última.
            if (id !== requestId) {
                return
            }

            rows.value = response.data?.data ?? []
            meta.value = response.data?.meta ?? {}
            links.value = response.data?.links ?? []
            error.value = null

            // Con datos nuevos los permisos se vuelven a preguntar.
            allowed.value = {}
        } catch (failure) {
            if (id !== requestId) {
                return
            }

            const described = core.describeError(failure, text())

            if (described.status === 403) {
                rows.value = []
                meta.value = {}
            } else if (rows.value.length > 0) {
                // Con filas en pantalla el error no tiene sitio en la tabla:
                // se avisa y se deja lo que había.
                notifyError(described.message)
            }

            error.value = described
        } finally {
            if (id === requestId) {
                loading.value = false
            }
        }
    }

    /**
     * Varios cambios en el mismo tick —un filtro nuevo que además vuelve a la
     * primera página— son una sola petición. Antes eran dos: el paginador
     * tenía su propia copia de la página y la devolvía al padre.
     */
    let scheduled = false

    const schedule = () => {
        if (scheduled) {
            return
        }

        scheduled = true

        queueMicrotask(() => {
            scheduled = false
            load()
        })
    }

    const refresh = () => load()

    const clearSelection = () => table.resetRowSelection(true)

    const sortColumn = (column) => {
        if (column?.sortable !== true) {
            return
        }

        internalSort = true
        sort.value = core.toggledSort(sort.value, column.id)
        orderBy.value = column.id
    }

    const updatePage = (next) => {
        const value = Number(next)

        if (Number.isInteger(value) && value >= 1) {
            page.value = value
        }
    }

    /**
     * Pregunta al backend qué se puede hacer con una fila —o con la barra, sin
     * id— antes de abrir su menú. Lo que responde se guarda hasta la próxima
     * carga, así que abrir dos veces el mismo menú no pregunta dos veces.
     */
    const preparePolicies = async (id = null) => {
        const key = id == null ? core.CRUD_POLICIES : String(id)

        if (allowed.value[key]) {
            return
        }

        try {
            const response = await axios(core.requestConfig(props.policyMethod, props.policyUrl, {
                _token: core.csrfToken(),
                id,
            }))

            allowed.value = { ...allowed.value, [key]: response.data ?? {} }
        } catch {
            // El menú se abre igual, con todo deshabilitado: es mejor que un
            // botón que no hace nada.
            notifyError(text().policiesFailed)
        }
    }

    const run = async (action) => {
        const kind = core.actionKind(action)

        if (kind === 'route') {
            if (! navigate) {
                notifyError(text().actionFailed)

                return undefined
            }

            try {
                await navigate(core.routeTarget(action, props.extraParams, props.extraQuery))
            } catch (failure) {
                // Una ruta que no existe es un error de quien declaró la
                // acción: el usuario recibe un aviso y la consola, el detalle.
                notifyError(text().actionFailed)
                console.error(failure)
            }

            return undefined
        }

        if (kind === 'link') {
            globalThis.window?.open(action.params?.link, action.params?.target ?? '_self')

            return undefined
        }

        if (typeof props.model[action.callback] !== 'function') {
            notifyError(text().actionFailed)

            return undefined
        }

        try {
            await props.model[action.callback](action.params)
        } catch (failure) {
            if (! core.isCancelled(failure)) {
                notifyError(core.describeError(failure, text(), text().actionFailed).message)
            }

            return undefined
        }

        if (action.success) {
            notifySuccess(action.success)
        }

        return load()
    }

    /**
     * Una acción masiva recibe los ids seleccionados —también los de otras
     * páginas— y las filas cargadas que están entre ellos.
     */
    const runBulk = async (action) => {
        if (typeof props.model[action.callback] !== 'function') {
            notifyError(text().actionFailed)

            return undefined
        }

        const ids = [...selectedIds.value]
        const loaded = table.getSelectedRowModel().rows.map((row) => row.original)

        try {
            await props.model[action.callback](ids, loaded)
        } catch (failure) {
            if (! core.isCancelled(failure)) {
                notifyError(core.describeError(failure, text(), text().actionFailed).message)
            }

            return undefined
        }

        clearSelection()

        if (action.success) {
            notifySuccess(action.success)
        }

        return load()
    }

    let lastForm = core.snapshot(props.formFilters)
    let lastExternal = core.snapshot(props.externalFilters)

    // Un filtro nuevo vuelve a la primera página; uno externo no. Los dos
    // descartan la selección, que era de otro listado.
    watch(() => props.formFilters, (value) => {
        const next = core.snapshot(value)

        if (next === lastForm) {
            return
        }

        lastForm = next
        page.value = 1
        clearSelection()
        schedule()
    }, { deep: true })

    watch(() => props.externalFilters, (value) => {
        const next = core.snapshot(value)

        if (next === lastExternal) {
            return
        }

        lastExternal = next
        clearSelection()
        schedule()
    }, { deep: true })

    watch([orderBy, sort, page], schedule)

    onMounted(load)

    // Lo que exponía la versión anterior, para quien lo lea desde fuera.
    const dataTable = computed(() => ({ head: visibleHead.value, body: rows.value }))
    const pagination = computed(() => ({ meta: meta.value, links: links.value }))

    return {
        table,
        head,
        visibleHead,
        rows,
        clones,
        meta,
        links,
        loading,
        error,
        sort,
        orderBy,
        page,
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
    }
}
