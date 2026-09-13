import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { routerKey } from 'vue-router'
import { getToasts, resetToasts } from 'innoboxrr-form-core'
import axios from 'axios'

import DataTable from '../src/DataTable.vue'

vi.mock('axios', () => ({ default: vi.fn() }))

// jsdom no mide ni tiene ResizeObserver: con Floating UI de verdad, abrir un
// menú no termina nunca. En un navegador lo coloca; aquí basta con saber que
// se abre.
vi.mock('@floating-ui/dom', () => ({
    autoUpdate: vi.fn((reference, floating, update) => {
        update()

        return () => {}
    }),
    computePosition: vi.fn(() => Promise.resolve({ x: 0, y: 0 })),
    flip: vi.fn(),
    offset: vi.fn(),
    shift: vi.fn(),
}))

const DATA_URL = '/api/posts/index'
const POLICY_URL = '/api/posts/policies'

const page = (rows = [], meta = {}) => ({
    data: {
        data: rows,
        meta: { total: rows.length, from: 1, to: rows.length, current_page: 1, last_page: 3, ...meta },
        links: [],
    },
})

const row = (id, name) => ({
    id,
    name,
    actions: [
        { id: 'view', name: 'Ver', icon: 'show', route: true, policy: false, params: { to: { name: 'Show', params: { id } } } },
        { id: 'delete', name: 'Borrar', icon: 'delete', route: false, policy: false, callback: 'deleteModel', params: { id } },
    ],
})

const makeModel = (overrides = {}) => ({
    crudActions: () => [
        { id: 'create', name: 'Crear', icon: 'plus', route: true, policy: false, params: { to: { name: 'Create', params: {} } } },
        { id: 'export', name: 'Exportar', icon: 'download', route: false, policy: false, callback: 'exportModel', params: {} },
    ],
    dataTableHead: () => [
        { id: 'id', value: 'ID', sortable: true, html: false },
        { id: 'name', value: 'Nombre', sortable: true, html: false },
    ],
    dataTableSort: () => ({ id: 'asc' }),
    setFilters: vi.fn(),
    deleteModel: vi.fn(() => Promise.resolve()),
    exportModel: vi.fn(() => Promise.resolve()),
    ...overrides,
})

const deferred = () => {
    let resolve
    let reject

    const promise = new Promise((ok, fail) => {
        resolve = ok
        reject = fail
    })

    return { promise, resolve, reject }
}

/** Responde datos o permisos según la URL, como el backend. */
const backend = ({ rows = [row(1, 'Uno'), row(2, 'Dos')], policies = {} } = {}) => (config) => (
    config.url === POLICY_URL
        ? Promise.resolve({ data: policies })
        : Promise.resolve(page(rows))
)

const dataCalls = () => axios.mock.calls.map(([config]) => config).filter((config) => config.url === DATA_URL)
const policyCalls = () => axios.mock.calls.map(([config]) => config).filter((config) => config.url === POLICY_URL)

const mountTable = async (props = {}, { model = makeModel(), router = { push: vi.fn() }, slots } = {}) => {
    const wrapper = mount(DataTable, {
        props: {
            dataUrl: DATA_URL,
            dataMethod: 'get',
            policyUrl: POLICY_URL,
            policyMethod: 'get',
            model,
            ...props,
        },
        slots,
        global: { provide: { [routerKey]: router } },
    })

    await flushPromises()

    return { wrapper, model, router }
}

const openMenu = async (wrapper, label) => {
    await wrapper.find(`button[aria-label="${label}"]`).trigger('click')
    await flushPromises()

    return wrapper.find(`[role="menu"][aria-label="${label}"]`)
}

const menuItem = (menu, text) => menu.findAll('[role="menuitem"]').find((item) => item.text() === text)

const headers = (wrapper) => wrapper.findAll('thead th').map((th) => th.text())

beforeEach(() => {
    vi.clearAllMocks()
    resetToasts()

    document.head.innerHTML = '<meta name="csrf-token" content="tok-123">'
    delete globalThis.csrf_token

    axios.mockImplementation(backend())
})

describe('carga', () => {
    it('pide los datos una vez al montarse y pinta las filas', async () => {
        const { wrapper } = await mountTable()

        expect(axios).toHaveBeenCalledTimes(1)
        expect(wrapper.findAll('tbody tr')).toHaveLength(2)
        expect(wrapper.text()).toContain('Uno')
        expect(wrapper.text()).toContain('Dos')
    })

    it('envia los filtros que espera el backend', async () => {
        await mountTable()

        expect(dataCalls()[0].params).toMatchObject({
            _token: 'tok-123',
            managed: true,
            except_view_any: true,
            orderBy: 'id',
            orderMode: 'asc',
            page: 1,
        })
    })

    it('usa data en lugar de params cuando el metodo es post', async () => {
        await mountTable({ dataMethod: 'post' })

        expect(dataCalls()[0]).toMatchObject({ method: 'post', params: null })
        expect(dataCalls()[0].data).not.toBeNull()
    })

    it('publica los filtros vigentes en el modelo', async () => {
        const { model } = await mountTable()

        expect(model.setFilters).toHaveBeenCalledWith(expect.objectContaining({ orderBy: 'id' }))
    })

    it('mientras llega la primera carga pinta la forma de las filas', async () => {
        const pending = deferred()

        axios.mockImplementationOnce(() => pending.promise)

        const { wrapper } = await mountTable()

        expect(wrapper.findAll('tr[data-skeleton]')).toHaveLength(5)
        expect(wrapper.find('table').attributes('aria-busy')).toBe('true')

        pending.resolve(page([row(1, 'Uno')]))
        await flushPromises()

        expect(wrapper.findAll('tr[data-skeleton]')).toHaveLength(0)
        expect(wrapper.find('table').attributes('aria-busy')).toBe('false')
    })

    it('sin filas lo dice en el sitio de las filas', async () => {
        axios.mockImplementation(backend({ rows: [] }))

        const { wrapper } = await mountTable()

        expect(wrapper.find('td.fe-table-empty').text()).toBe('No hay resultados')
    })

    /**
     * Quien cambia de página dos veces seguidas tiene que ver la última,
     * aunque la primera respuesta llegue después.
     */
    it('una respuesta que llega tarde no pisa a la ultima', async () => {
        const { wrapper } = await mountTable()

        const slow = deferred()
        const fast = deferred()

        axios.mockImplementationOnce(() => slow.promise).mockImplementationOnce(() => fast.promise)

        await wrapper.find('select').setValue('2')
        await flushPromises()
        await wrapper.find('select').setValue('3')
        await flushPromises()

        fast.resolve(page([row(3, 'Tres')], { current_page: 3 }))
        await flushPromises()

        slow.resolve(page([row(2, 'Vieja')], { current_page: 2 }))
        await flushPromises()

        expect(wrapper.text()).toContain('Tres')
        expect(wrapper.text()).not.toContain('Vieja')
    })

    it('refresh() vuelve a pedir la pagina', async () => {
        const { wrapper } = await mountTable()

        await wrapper.vm.refresh()

        expect(dataCalls()).toHaveLength(2)
    })
})

describe('errores', () => {
    /**
     * Un 403 dejaba la tabla con «No results found», como si no hubiera
     * registros, y además se reintentaba tres veces.
     */
    it('un 403 dice que no hay permiso y no reintenta', async () => {
        axios.mockRejectedValue({ response: { status: 403 } })

        const { wrapper } = await mountTable()

        await new Promise((resolve) => setTimeout(resolve, 20))

        expect(axios).toHaveBeenCalledTimes(1)
        expect(wrapper.find('[role="alert"]').text()).toBe('No tienes permiso para ver estos registros.')
        expect(wrapper.find('td.fe-table-empty button').exists()).toBe(false)
        // Visto en el navegador: el pie decía «No hay resultados» debajo.
        expect(wrapper.text()).not.toContain('No hay resultados')
    })

    it('un fallo de red se ve y se puede reintentar', async () => {
        axios.mockRejectedValueOnce(new Error('Network Error'))

        const { wrapper } = await mountTable()

        expect(wrapper.find('[role="alert"]').text()).toBe('No se pudo conectar con el servidor.')

        await wrapper.find('td.fe-table-empty button').trigger('click')
        await flushPromises()

        expect(dataCalls()).toHaveLength(2)
        expect(wrapper.text()).toContain('Uno')
    })

    it('un fallo al recargar avisa y deja las filas que habia', async () => {
        const { wrapper } = await mountTable()

        axios.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Server Error' } } })

        await wrapper.find('button[aria-label="Actualizar"]').trigger('click')
        await flushPromises()

        expect(getToasts()).toEqual([expect.objectContaining({ message: 'Server Error', variant: 'danger' })])
        expect(wrapper.text()).toContain('Uno')
    })
})

describe('columnas y orden', () => {
    it('pinta las cabeceras que declara el modelo', async () => {
        const { wrapper } = await mountTable()

        expect(headers(wrapper)).toEqual(expect.arrayContaining(['ID', 'Nombre']))
    })

    it('oculta las columnas indicadas en hideColumns, como objetos o cadenas', async () => {
        const { wrapper } = await mountTable({ hideColumns: [{ id: 'name' }] })

        expect(headers(wrapper)).not.toContain('Nombre')
        expect(wrapper.findAll('tbody tr')[0].findAll('td')).toHaveLength(2)

        await wrapper.setProps({ hideColumns: ['id'] })

        expect(headers(wrapper)).toContain('Nombre')
        expect(headers(wrapper)).not.toContain('ID')
        expect(wrapper.findAll('tbody tr')[0].text()).toContain('Uno')
    })

    /**
     * Ordenar se hace con un botón dentro del <th>, que es lo que se puede
     * alcanzar con el teclado; el sentido lo anuncia aria-sort.
     */
    it('invierte el orden al pulsar una columna ordenable', async () => {
        const { wrapper } = await mountTable()

        const sortButton = () => wrapper.find('#th_id button')

        expect(wrapper.find('#th_id').attributes('aria-sort')).toBe('ascending')

        await sortButton().trigger('click')
        await flushPromises()

        expect(dataCalls().at(-1).params.orderMode).toBe('desc')
        expect(wrapper.find('#th_id').attributes('aria-sort')).toBe('descending')

        await sortButton().trigger('click')
        await flushPromises()

        expect(dataCalls().at(-1).params.orderMode).toBe('asc')
    })

    it('ordena por la columna pulsada con una sola peticion', async () => {
        const { wrapper } = await mountTable()

        await wrapper.find('#th_name button').trigger('click')
        await flushPromises()

        expect(dataCalls()).toHaveLength(2)
        expect(dataCalls().at(-1).params.orderBy).toBe('name')
        expect(wrapper.find('#th_name').attributes('aria-sort')).toBe('ascending')
        expect(wrapper.find('#th_id').attributes('aria-sort')).toBe('none')
    })

    it('una columna que no se ordena no tiene boton ni aria-sort', async () => {
        const { wrapper } = await mountTable({}, {
            model: makeModel({ dataTableHead: () => [{ id: 'name', value: 'Nombre', sortable: false }] }),
        })

        expect(wrapper.find('#th_name button').exists()).toBe(false)
        expect(wrapper.find('#th_name').attributes('aria-sort')).toBeUndefined()
    })
})

describe('filtros y paginas', () => {
    /**
     * El paginador guardaba su propia copia de la página y la devolvía al
     * padre al reiniciarse: un filtro nuevo eran dos peticiones iguales.
     */
    it('un filtro nuevo vuelve a la primera pagina con una sola peticion', async () => {
        const { wrapper } = await mountTable()

        await wrapper.find('select').setValue('2')
        await flushPromises()

        expect(dataCalls().at(-1).params.page).toBe(2)

        const before = dataCalls().length

        await wrapper.setProps({ formFilters: { name: 'Uno' } })
        await flushPromises()

        expect(dataCalls()).toHaveLength(before + 1)
        expect(dataCalls().at(-1).params).toMatchObject({ name: 'Uno', page: 1 })
    })

    it('un filtro externo recarga sin cambiar de pagina', async () => {
        const { wrapper } = await mountTable()

        await wrapper.find('select').setValue('2')
        await flushPromises()

        await wrapper.setProps({ externalFilters: { status: 'active' } })
        await flushPromises()

        expect(dataCalls().at(-1).params).toMatchObject({ status: 'active', page: 2 })
    })

    it('los mismos filtros en otro objeto no recargan', async () => {
        const { wrapper } = await mountTable({ formFilters: { name: 'Uno' } })

        await wrapper.setProps({ formFilters: { name: 'Uno' } })
        await flushPromises()

        expect(dataCalls()).toHaveLength(1)
    })

    it('el panel de filtros esta oculto hasta que se pide', async () => {
        const { wrapper } = await mountTable({}, { slots: { filterForm: '<div class="mi-filtro" />' } })

        expect(wrapper.find('.mi-filtro').exists()).toBe(true)
        expect(wrapper.find('.filter-form').attributes('hidden')).toBeDefined()

        await wrapper.find('button[aria-label="Filtros"]').trigger('click')

        expect(wrapper.find('.filter-form').attributes('hidden')).toBeUndefined()
        expect(wrapper.find('button[aria-label="Filtros"]').attributes('aria-expanded')).toBe('true')
    })

    it('no pinta la barra superior cuando se desactiva', async () => {
        const { wrapper } = await mountTable({ showTopbar: false })

        expect(wrapper.find('.filter-form').exists()).toBe(false)
        expect(wrapper.find('button[aria-label="Actualizar"]').exists()).toBe(false)
    })
})

describe('permisos y acciones', () => {
    /**
     * El menú se abría al instante con todo deshabilitado y se habilitaba
     * cuando llegaba la respuesta: el usuario veía parpadear lo que no podía
     * hacer.
     */
    it('pregunta los permisos de la barra antes de abrir su menu', async () => {
        axios.mockImplementation(backend({ policies: { create: true, export: false } }))

        const { wrapper } = await mountTable()

        const menu = await openMenu(wrapper, 'Acciones')

        expect(policyCalls()).toHaveLength(1)
        expect(policyCalls()[0].params).toMatchObject({ id: null })
        expect(menu.attributes('hidden')).toBeUndefined()
        expect(menuItem(menu, 'Crear').attributes('aria-disabled')).toBeUndefined()
        expect(menuItem(menu, 'Exportar').attributes('aria-disabled')).toBe('true')
        expect(menuItem(menu, 'Exportar').attributes('data-tooltip')).toBe('No tienes permiso para esta acción.')
        expect(wrapper.vm.crudActions.find((action) => action.id === 'create').policy).toBe(true)
    })

    it('pregunta los permisos de una fila con su id, una sola vez por carga', async () => {
        axios.mockImplementation(backend({ policies: { view: true } }))

        const { wrapper } = await mountTable()

        const menu = await openMenu(wrapper, 'Acciones del registro 1')

        expect(policyCalls()[0].params).toMatchObject({ id: 1 })
        expect(menuItem(menu, 'Ver').attributes('aria-disabled')).toBeUndefined()
        expect(menuItem(menu, 'Borrar').attributes('aria-disabled')).toBe('true')

        // Cerrar y volver a abrir no vuelve a preguntar.
        await wrapper.find('button[aria-label="Acciones del registro 1"]').trigger('click')
        await openMenu(wrapper, 'Acciones del registro 1')

        expect(policyCalls()).toHaveLength(1)
    })

    it('si no se pueden comprobar los permisos avisa y abre con todo deshabilitado', async () => {
        axios.mockImplementation((config) => (
            config.url === POLICY_URL ? Promise.reject(new Error('Network Error')) : Promise.resolve(page([row(1, 'Uno')]))
        ))

        const { wrapper } = await mountTable()

        const menu = await openMenu(wrapper, 'Acciones del registro 1')

        expect(getToasts()).toEqual([expect.objectContaining({ message: 'No se pudieron comprobar los permisos.' })])
        expect(menu.attributes('hidden')).toBeUndefined()
        expect(menu.findAll('[role="menuitem"]').every((item) => item.attributes('aria-disabled') === 'true')).toBe(true)
    })

    it('ejecuta el callback de una accion y recarga', async () => {
        axios.mockImplementation(backend({ policies: { delete: true } }))

        const { wrapper, model } = await mountTable()

        const menu = await openMenu(wrapper, 'Acciones del registro 1')

        await menuItem(menu, 'Borrar').trigger('click')
        await flushPromises()

        expect(model.deleteModel).toHaveBeenCalledWith({ id: 1 })
        expect(dataCalls()).toHaveLength(2)
    })

    it('una confirmacion cancelada no avisa ni recarga', async () => {
        axios.mockImplementation(backend({ policies: { delete: true } }))

        const model = makeModel({
            deleteModel: vi.fn(() => Promise.reject(Object.assign(new Error('cancelada'), { name: 'RequestCancelledError' }))),
        })

        const { wrapper } = await mountTable({}, { model })

        await menuItem(await openMenu(wrapper, 'Acciones del registro 1'), 'Borrar').trigger('click')
        await flushPromises()

        expect(getToasts()).toEqual([])
        expect(dataCalls()).toHaveLength(1)
    })

    it('una accion que falla dice por que', async () => {
        axios.mockImplementation(backend({ policies: { delete: true } }))

        const model = makeModel({
            deleteModel: vi.fn(() => Promise.reject({ response: { status: 422, data: { message: 'Tiene pedidos' } } })),
        })

        const { wrapper } = await mountTable({}, { model })

        await menuItem(await openMenu(wrapper, 'Acciones del registro 1'), 'Borrar').trigger('click')
        await flushPromises()

        expect(getToasts()).toEqual([expect.objectContaining({ message: 'Tiene pedidos', variant: 'danger' })])
    })

    it('una accion de ruta navega con los params extra', async () => {
        axios.mockImplementation(backend({ policies: { view: true } }))

        const { wrapper, router } = await mountTable({ extraParams: { tenant: 't1' } })

        await menuItem(await openMenu(wrapper, 'Acciones del registro 2'), 'Ver').trigger('click')

        expect(router.push).toHaveBeenCalledWith({ name: 'Show', params: { id: 2, tenant: 't1' }, query: {} })
    })

    it('sin acciones no pinta menus', async () => {
        const { wrapper } = await mountTable({ hasActions: false })

        expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    })
})

describe('seleccion', () => {
    const selectableModel = () => makeModel({
        bulkActions: () => [{ id: 'delete', name: 'Borrar seleccionados', callback: 'bulkDelete', danger: true }],
        bulkDelete: vi.fn(() => Promise.resolve()),
    })

    it('sin selectable no hay casillas', async () => {
        const { wrapper } = await mountTable()

        expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
    })

    it('seleccionar filas muestra cuantas hay y que hacer con ellas', async () => {
        const { wrapper } = await mountTable({ selectable: true }, { model: selectableModel() })

        expect(wrapper.find('[role="region"]').exists()).toBe(false)

        await wrapper.find('input[aria-label="Seleccionar el registro 1"]').trigger('click')

        expect(wrapper.find('[role="region"]').text()).toContain('1 seleccionados')
        expect(wrapper.findAll('tbody tr')[0].attributes('data-selected')).toBe('true')

        await wrapper.find('input[aria-label="Seleccionar todos los de esta página"]').setValue(true)

        expect(wrapper.find('[role="region"]').text()).toContain('2 seleccionados')

        await wrapper.find('[role="region"] .fe-button-link').trigger('click')

        expect(wrapper.find('[role="region"]').exists()).toBe(false)
        expect(wrapper.vm.selectedIds).toEqual([])
    })

    it('la casilla general queda a medias con parte de la pagina elegida', async () => {
        const { wrapper } = await mountTable({ selectable: true })

        await wrapper.find('input[aria-label="Seleccionar el registro 2"]').trigger('click')

        expect(wrapper.find('input[aria-label="Seleccionar todos los de esta página"]').element.indeterminate).toBe(true)
    })

    it('una accion masiva recibe los ids y las filas, limpia la seleccion y recarga', async () => {
        const model = selectableModel()
        const { wrapper } = await mountTable({ selectable: true }, { model })

        await wrapper.find('input[aria-label="Seleccionar todos los de esta página"]').setValue(true)
        await wrapper.findAll('[role="region"] button').find((button) => button.text() === 'Borrar seleccionados').trigger('click')
        await flushPromises()

        expect(model.bulkDelete).toHaveBeenCalledWith(['1', '2'], [expect.objectContaining({ id: 1 }), expect.objectContaining({ id: 2 })])
        expect(wrapper.vm.selectedIds).toEqual([])
        expect(dataCalls()).toHaveLength(2)
    })

    it('un filtro nuevo descarta la seleccion', async () => {
        const { wrapper } = await mountTable({ selectable: true })

        await wrapper.find('input[aria-label="Seleccionar el registro 1"]').trigger('click')
        await wrapper.setProps({ formFilters: { name: 'x' } })
        await flushPromises()

        expect(wrapper.vm.selectedIds).toEqual([])
    })
})

describe('celdas', () => {
    it('un componente de celda recibe su valor y avisa con callback', async () => {
        const callback = vi.fn()

        axios.mockImplementation(backend({ rows: [{ id: 1, status: 'ok', actions: [] }] }))

        const { wrapper } = await mountTable({}, {
            model: makeModel({
                dataTableHead: () => [{ id: 'status', value: 'Estado', component: 'Badge', callback }],
                dataTableComponents: () => ({
                    Badge: {
                        props: ['value'],
                        emits: ['callback'],
                        template: '<button class="badge" @click="$emit(\'callback\', value)">{{ value }}</button>',
                    },
                }),
            }),
        })

        await wrapper.find('.badge').trigger('click')

        expect(wrapper.find('.badge').text()).toBe('ok')
        expect(callback).toHaveBeenCalledWith('ok', expect.objectContaining({ id: 1 }))
    })

    it('una columna html se pinta como html', async () => {
        axios.mockImplementation(backend({ rows: [{ id: 1, name: '<strong>Uno</strong>', actions: [] }] }))

        const { wrapper } = await mountTable({}, {
            model: makeModel({ dataTableHead: () => [{ id: 'name', value: 'Nombre', html: true }] }),
        })

        expect(wrapper.find('tbody strong').text()).toBe('Uno')
    })
})

describe('aislamiento de las filas', () => {
    it('un parser que muta su fila no toca los datos de la tabla', async () => {
        const rows = [{ id: 1, name: 'Original', actions: [] }]

        axios.mockImplementation(backend({ rows }))

        const { wrapper } = await mountTable({}, {
            model: makeModel({
                dataTableHead: () => [{
                    id: 'name',
                    value: 'Nombre',
                    parser: (value, fila) => {
                        fila.name = 'MUTADO'

                        return String(value).toUpperCase()
                    },
                }],
            }),
        })

        expect(wrapper.text()).toContain('ORIGINAL')
        expect(rows[0].name).toBe('Original')
    })

    it('dos tablas sobre las mismas filas no se pisan', async () => {
        const rows = [{ id: 1, name: 'Uno', actions: [] }]

        axios.mockImplementation(backend({ rows }))

        const { wrapper: primera } = await mountTable({}, {
            model: makeModel({ dataTableHead: () => [{ id: 'name', value: 'Nombre', parser: (v) => `A:${v}` }] }),
        })

        const { wrapper: segunda } = await mountTable({}, {
            model: makeModel({ dataTableHead: () => [{ id: 'name', value: 'Nombre', parser: (v) => `B:${v}` }] }),
        })

        expect(primera.text()).toContain('A:Uno')
        expect(segunda.text()).toContain('B:Uno')
    })
})
