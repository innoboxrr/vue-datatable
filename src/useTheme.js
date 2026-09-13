import { onScopeDispose, shallowRef } from 'vue'
import { getTheme, onThemeChange } from 'innoboxrr-form-core'

/**
 * El tema de innoboxrr-form-core, como referencia reactiva.
 *
 * El tema es estado de módulo, fuera de Vue: sin la suscripción, un `setTheme`
 * con la tabla ya montada no la repintaría.
 *
 * @returns {import('vue').ShallowRef<Record<string, string>>}
 */
export default function useTheme() {
    const theme = shallowRef(getTheme())

    onScopeDispose(onThemeChange((next) => {
        theme.value = { ...next }
    }))

    return theme
}
