<template>

    <div :class="theme.tableFooter">

        <span>{{ summaryText }}</span>

        <div v-if="last > 1" :class="theme.tablePager">

            <button
                type="button"
                :class="theme.iconButton"
                :aria-label="text.previous"
                :disabled="current <= 1"
                @click="go(current - 1)">
                <IconComponent name="previous" :size="14" />
            </button>

            <select
                :class="theme.select"
                :aria-label="text.page"
                :value="current"
                @change="go($event.target.value)">
                <option v-for="page in last" :key="page" :value="page">{{ page }}</option>
            </select>

            <span>{{ text.of }} {{ last }}</span>

            <button
                type="button"
                :class="theme.iconButton"
                :aria-label="text.next"
                :disabled="current >= last"
                @click="go(current + 1)">
                <IconComponent name="next" :size="14" />
            </button>

        </div>

    </div>

</template>

<script setup>

    /**
     * El pie de la tabla: cuántos registros se ven y en qué página se está.
     *
     * No guarda la página. Antes tenía su propia copia: al reiniciar los
     * filtros el padre volvía a la 1, el paginador se enteraba después y la
     * devolvía, y eso era una segunda petición idéntica.
     */

    import { computed } from 'vue'
    import IconComponent from 'innoboxrr-form-elements/src/IconComponent.vue'

    import useTheme from '../useTheme.js'
    import { DEFAULT_LABELS, summary } from '../table.js'

    const props = defineProps({
        meta: {
            type: Object,
            default: () => ({}),
        },
        // Se sigue aceptando para no romper a quien lo pasa; la página sale de
        // `meta`.
        links: {
            type: [Array, Object],
            default: () => [],
        },
        labels: {
            type: Object,
            default: () => ({}),
        },
    })

    const emit = defineEmits(['updatePage'])

    const theme = useTheme()

    const text = computed(() => ({ ...DEFAULT_LABELS, ...props.labels }))

    const current = computed(() => Number(props.meta?.current_page ?? 1))
    const last = computed(() => Number(props.meta?.last_page ?? 1))

    const summaryText = computed(() => summary(props.meta ?? {}, text.value))

    const go = (value) => {
        const page = Number(value)

        if (page >= 1 && page <= last.value && page !== current.value) {
            emit('updatePage', page)
        }
    }

</script>
