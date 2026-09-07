import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import axios from 'axios'
import DataTable from '../src/DataTable.vue'

vi.mock('axios', () => ({ default: vi.fn() }))

const page = (rows = []) => ({
    data: {
        data: rows,
        meta: { total: rows.length, from: 1, to: rows.length, current_page: 1, last_page: 1 },
        links: [],
    },
})

const row = (id, name) => ({
    id,
    name,
    actions: [
        { id: 'view', name: 'Ver', icon: 'eye', route: true, policy: false, params: { to: { name: 'Show', params: { id } } } },
        { id: 'delete', name: 'Borrar', icon: 'trash', route: false, policy: false, callback: 'deleteModel', params: { id } },
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

const factory = async (props = {}, model = makeModel()) => {
    const wrapper = mount(DataTable, {
        props: {
            dataUrl: '/api/posts/index',
            dataMethod: 'get',
            policyUrl: '/api/posts/policies',
            policyMethod: 'get',
            model,
            ...props,
        },
        global: {
            stubs: {
                RouterLink: { props: ['to'], template: '<a><slot /></a>' },
            },
        },
    })

    await flushPromises()

    return { wrapper, model }
}

beforeEach(() => {
    vi.clearAllMocks()

    document.head.innerHTML = '<meta name="csrf-token" content="tok-123">'

    // La version en Options API leia estas globales sin importarlas.
    globalThis.axios = axios
    globalThis.csrf_token = 'tok-123'
    globalThis.UIkit = { update: vi.fn(), dropdown: vi.fn(() => ({ hide: vi.fn() })) }

    axios.mockResolvedValue(page([row(1, 'Uno'), row(2, 'Dos')]))
})

describe('DataTable', () => {

    it('pide los datos al montarse y pinta las filas', async () => {
        const { wrapper } = await factory()

        expect(axios).toHaveBeenCalledTimes(1)
        expect(wrapper.findAll('tbody tr')).toHaveLength(2)
        expect(wrapper.text()).toContain('Uno')
        expect(wrapper.text()).toContain('Dos')
    })

    it('envia los filtros que espera el backend', async () => {
        await factory()

        const params = axios.mock.calls[0][0].params

        expect(params._token).toBe('tok-123')
        expect(params.managed).toBe(true)
        expect(params.except_view_any).toBe(true)
        expect(params.orderBy).toBe('id')
        expect(params.orderMode).toBe('asc')
        expect(params.page).toBe(1)
    })

    it('usa data en lugar de params cuando el metodo es post', async () => {
        await factory({ dataMethod: 'post' })

        const config = axios.mock.calls[0][0]

        expect(config.method).toBe('post')
        expect(config.data).not.toBeNull()
        expect(config.params).toBeNull()
    })

    it('pinta las cabeceras que declara el modelo', async () => {
        const { wrapper } = await factory()

        const headers = wrapper.findAll('thead th').map((th) => th.text())

        expect(headers).toContain('ID')
        expect(headers).toContain('Nombre')
    })

    it('oculta las columnas indicadas en hideColumns', async () => {
        const { wrapper } = await factory({ hideColumns: [{ id: 'name' }] })

        const headers = wrapper.findAll('thead th').map((th) => th.text())

        expect(headers).toContain('ID')
        expect(headers).not.toContain('Nombre')
    })

    it('invierte el orden al pulsar una columna ordenable', async () => {
        const { wrapper } = await factory()

        await wrapper.findAll('thead th')[0].trigger('click')
        await flushPromises()

        expect(axios.mock.calls.at(-1)[0].params.orderMode).toBe('desc')

        await wrapper.findAll('thead th')[0].trigger('click')
        await flushPromises()

        expect(axios.mock.calls.at(-1)[0].params.orderMode).toBe('asc')
    })

    it('ordena por la columna pulsada', async () => {
        const { wrapper } = await factory()

        await wrapper.findAll('thead th')[1].trigger('click')
        await flushPromises()

        expect(axios.mock.calls.at(-1)[0].params.orderBy).toBe('name')
    })

    it('publica los filtros vigentes en el modelo', async () => {
        const { wrapper, model } = await factory()

        await wrapper.findAll('thead th')[0].trigger('click')
        await flushPromises()

        expect(model.setFilters).toHaveBeenCalled()
    })

    it('recarga cuando cambian los filtros del formulario', async () => {
        const { wrapper } = await factory()

        await wrapper.setProps({ formFilters: { name: 'Uno' } })
        await flushPromises()

        expect(axios.mock.calls.at(-1)[0].params.name).toBe('Uno')
    })

    it('vuelve a la primera pagina al cambiar los filtros', async () => {
        const { wrapper } = await factory()

        await wrapper.setProps({ formFilters: { name: 'x' } })
        await flushPromises()

        expect(axios.mock.calls.at(-1)[0].params.page).toBe(1)
    })

    it('consulta las politicas y habilita las acciones permitidas', async () => {
        const { wrapper } = await factory()

        axios.mockResolvedValueOnce({ data: { create: true, export: false } })

        await wrapper.find('button').trigger('click')
        await flushPromises()

        const config = axios.mock.calls.at(-1)[0]

        expect(config.url).toBe('/api/posts/policies')
        expect(wrapper.vm.crudActions.find((a) => a.id === 'create').policy).toBe(true)
        expect(wrapper.vm.crudActions.find((a) => a.id === 'export').policy).toBe(false)
    })

    it('no pinta la barra superior cuando se desactiva', async () => {
        const { wrapper } = await factory({ showTopbar: false })

        expect(wrapper.find('.filter-form').exists()).toBe(false)
    })

    it('expone el slot del formulario de filtros', async () => {
        const wrapper = mount(DataTable, {
            props: {
                dataUrl: '/x',
                dataMethod: 'get',
                policyUrl: '/y',
                policyMethod: 'get',
                model: makeModel(),
            },
            slots: { filterForm: '<div class="mi-filtro" />' },
            global: { stubs: { RouterLink: { props: ['to'], template: '<a><slot /></a>' } } },
        })

        await flushPromises()

        expect(wrapper.find('.mi-filtro').exists()).toBe(true)
    })

    /**
     * El catch leia error.response.status sin comprobarlo: un fallo de red
     * (sin respuesta) lanzaba un TypeError dentro del propio manejador.
     */
    it('sobrevive a un error de red sin respuesta', async () => {
        axios.mockRejectedValueOnce(new Error('Network Error'))

        const { wrapper } = await factory()

        expect(wrapper.findAll('tbody tr')).toHaveLength(0)
    })

})
