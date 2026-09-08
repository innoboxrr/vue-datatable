import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import DisabledLinkComponent from '../src/components/DisabledLinkComponent.vue'
import NavDropdownComponent from '../src/components/NavDropdownComponent.vue'
import IconLinkComponent from '../src/components/IconLinkComponent.vue'
import IconRouteComponent from '../src/components/IconRouteComponent.vue'
import PaginationComponent from '../src/components/PaginationComponent.vue'
import SelectPaginationComponent from '../src/components/SelectPaginationComponent.vue'

beforeEach(() => {
    globalThis.UIkit = { update: vi.fn(), dropdown: vi.fn(() => ({ hide: vi.fn() })) }
})

describe('DisabledLinkComponent', () => {

    it('pinta el texto y el tooltip de no autorizado', () => {
        const wrapper = mount(DisabledLinkComponent, { props: { text: 'Editar' } })

        expect(wrapper.text()).toContain('Editar')
        expect(wrapper.attributes('data-tooltip')).toBe('This action is not authorized')
        expect(wrapper.attributes('data-tooltip-pos')).toBe('right')
    })

    it('muestra el icono solo si se le pasa uno', () => {
        expect(mount(DisabledLinkComponent, { props: { text: 'x' } }).find('svg').exists()).toBe(false)

        const wrapper = mount(DisabledLinkComponent, { props: { text: 'x', icon: 'delete' } })

        expect(wrapper.find('svg').exists()).toBe(true)
    })

})

describe('NavDropdownComponent', () => {

    it('compone las opciones de uk-dropdown', () => {
        const wrapper = mount(NavDropdownComponent, { props: { pos: 'right', mode: 'hover' } })

        const options = wrapper.attributes('uk-dropdown')

        expect(options).toContain('pos: right')
        expect(options).toContain('mode: hover')
        expect(options).toContain('animation: uk-animation-slide-top-small')
    })

    it('renderiza el contenido del slot dentro de la lista', () => {
        const wrapper = mount(NavDropdownComponent, { slots: { default: '<li>uno</li>' } })

        expect(wrapper.find('ul.fe-menu li').text()).toBe('uno')
    })

})

describe('IconLinkComponent', () => {

    const factory = (props = {}) => mount(IconLinkComponent, {
        props: { text: 'Ver', icon: 'eye', ...props },
    })

    /**
     * El nombre semantico lo resuelve el mapa de innoboxrr-form-core, que es
     * el mismo que usa la rama React. Aqui solo se comprueba que el icono se
     * pinta y que respeta el ratio.
     */
    it('pinta el icono', () => {
        expect(factory().find('svg').exists()).toBe(true)
    })

    it('escala el tamano segun el ratio, que era el multiplicador de UIkit sobre 16px', () => {
        expect(factory().find('svg').attributes('width')).toBe('16')
        expect(factory({ ratio: 2 }).find('svg').attributes('width')).toBe('32')
    })

    it('usa # y _self por defecto', () => {
        expect(factory().attributes('href')).toBe('#')
        expect(factory().attributes('target')).toBe('_self')

        const wrapper = factory({ link: 'https://x.test', target: '_blank' })

        expect(wrapper.attributes('href')).toBe('https://x.test')
        expect(wrapper.attributes('target')).toBe('_blank')
    })

})

describe('IconRouteComponent', () => {

    const factory = (props = {}) => mount(IconRouteComponent, {
        props: { name: 'AdminShowPost', text: 'Ver', icon: 'eye', ...props },
        global: {
            stubs: {
                RouterLink: {
                    props: ['to'],
                    template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
                },
            },
        },
    })

    it('construye el destino con nombre, params y query', () => {
        const wrapper = factory({ params: { id: 7 }, query: { tab: 'a' } })

        expect(JSON.parse(wrapper.find('a').attributes('data-to'))).toEqual({
            name: 'AdminShowPost',
            params: { id: 7 },
            query: { tab: 'a' },
        })
    })

    /**
     * El destino se calculaba en data(), es decir una sola vez al crear el
     * componente: al reutilizar la fila para otro registro el enlace seguia
     * apuntando al anterior.
     */
    it('actualiza el destino cuando cambian los params', async () => {
        const wrapper = factory({ params: { id: 1 } })

        await wrapper.setProps({ params: { id: 2 } })

        expect(JSON.parse(wrapper.find('a').attributes('data-to')).params).toEqual({ id: 2 })
    })

})

describe('PaginationComponent', () => {

    const links = (n) => Array.from({ length: n }, (_, i) => ({
        url: `/p/${i}`,
        label: String(i),
        active: i === 1,
    }))

    it('no se pinta con tres enlaces o menos', () => {
        expect(mount(PaginationComponent, { props: { links: links(3) } }).find('ul').exists()).toBe(false)
    })

    it('pinta los enlaces intermedios entre el primero y el ultimo', () => {
        const wrapper = mount(PaginationComponent, { props: { links: links(5) } })

        // 5 enlaces: primero + 3 intermedios + ultimo
        expect(wrapper.findAll('li')).toHaveLength(5)
    })

    it('emite go con la url del enlace pulsado', async () => {
        const wrapper = mount(PaginationComponent, { props: { links: links(5) } })

        await wrapper.findAll('li')[2].find('a').trigger('click')

        expect(wrapper.emitted('go')).toBeTruthy()
    })

})

describe('SelectPaginationComponent', () => {

    const meta = { total: 42, from: 1, to: 15, current_page: 1, last_page: 3 }

    const factory = (overrides = {}) => mount(SelectPaginationComponent, {
        props: { meta: { ...meta, ...overrides }, links: {} },
    })

    it('resume cuantos resultados se estan mostrando', () => {
        expect(factory().text()).toContain('Showing 1 to 15 of 42 entries')
    })

    it('avisa cuando no hay resultados', () => {
        expect(factory({ total: 0 }).text()).toContain('No results found')
    })

    it('ofrece una opcion por pagina', () => {
        expect(factory().findAll('option')).toHaveLength(3)
    })

    it('emite updatePage al elegir otra pagina', async () => {
        const wrapper = factory()

        await wrapper.find('select').setValue(2)

        expect(wrapper.emitted('updatePage').at(-1)).toEqual([2])
    })

})
