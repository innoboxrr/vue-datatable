<template>

	<a
		class="block px-4 py-2 dark:hover:text-white dark:text-slate-400"
		:href="link"
		:target="target">

		<Icon
			class="fe-mr-sm"
			:icon="resolved"
			:width="size"
			:height="size"
			aria-hidden="true" />

		<span :class="textClass">{{ text }}</span>

	</a>

</template>

<script setup>

	/**
	 * Antes esto pintaba `<span class="uk-icon" uk-icon="icon: fa-plus">` y
	 * llamaba a `globalThis.UIkit.update()` al montar. Para que ese icono
	 * apareciera hacian falta tres dependencias que ningun package.json
	 * declaraba: uikit, fontawesome y uikit-custom-icons, que hacia de puente
	 * entre las dos.
	 *
	 * Ahora el nombre se resuelve contra el mapa de innoboxrr-form-core, que
	 * es el mismo que usa la rama React.
	 */

	import { computed, onScopeDispose, ref } from 'vue'
	import { Icon } from '@iconify/vue'
	import { iconFor, onIconChange } from 'innoboxrr-form-core'

	const props = defineProps({
		link: {
			type: String,
			default: '#'
		},
		text: {
			type: String,
			required: true
		},
		icon: {
			type: String,
			required: true
		},
		ratio: {
			type: Number,
			required: false,
			default: 1
		},
		textClass: {
			type: String,
			default: ""
		},
		target: {
			type: String,
			default: "_self"
		}
	})

	// Un cambio de mapa en caliente repinta lo ya montado.
	const version = ref(0)

	onScopeDispose(onIconChange(() => version.value++))

	const resolved = computed(() => {
		version.value

		return iconFor(props.icon)
	})

	// `ratio` era el multiplicador de UIkit sobre 16px. Se conserva para no
	// romper a quien ya lo pasa.
	const size = computed(() => props.ratio * 16)

</script>
