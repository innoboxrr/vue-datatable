import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import SelectPaginationComponent from '../src/components/SelectPaginationComponent.vue'

const meta = { total: 42, from: 1, to: 15, current_page: 1, last_page: 3 }

const factory = (overrides = {}) => mount(SelectPaginationComponent, {
    props: { meta: { ...meta, ...overrides } },
})

describe('SelectPaginationComponent', () => {
    it('resume cuantos registros se ven', () => {
        expect(factory().text()).toContain('1–15 de 42')
    })

    it('sin registros lo dice', () => {
        expect(factory({ total: 0, last_page: 1 }).text()).toContain('No hay resultados')
    })

    it('con una sola pagina no hay paginador', () => {
        expect(factory({ last_page: 1 }).find('select').exists()).toBe(false)
    })

    it('ofrece una opcion por pagina', () => {
        expect(factory().findAll('option')).toHaveLength(3)
    })

    it('emite updatePage al elegir otra pagina', async () => {
        const wrapper = factory()

        await wrapper.find('select').setValue('2')

        expect(wrapper.emitted('updatePage').at(-1)).toEqual([2])
    })

    it('las flechas se detienen en los extremos', async () => {
        const first = factory()

        expect(first.find('button[aria-label="Página anterior"]').attributes('disabled')).toBeDefined()

        await first.find('button[aria-label="Página siguiente"]').trigger('click')

        expect(first.emitted('updatePage').at(-1)).toEqual([2])
        expect(factory({ current_page: 3 }).find('button[aria-label="Página siguiente"]').attributes('disabled')).toBeDefined()
    })

    /**
     * Tenía su propia copia de la página: al reiniciar los filtros el padre
     * volvía a la 1, el paginador se enteraba después y la devolvía, y eso era
     * una segunda petición idéntica.
     */
    it('no guarda la pagina: sigue la que llega y no la devuelve', async () => {
        const wrapper = factory({ current_page: 2 })

        await wrapper.setProps({ meta: { ...meta, current_page: 1 } })

        expect(wrapper.find('select').element.value).toBe('1')
        expect(wrapper.emitted('updatePage')).toBeUndefined()
    })
})
