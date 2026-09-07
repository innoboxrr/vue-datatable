<template>

	<a
		class="block px-4 py-2 dark:hover:text-white dark:text-slate-400"
		:href="link"
		:target="target">

		<span
			class="fe-mr-sm uk-icon"
			:uk-icon="iconAttr"
			:style="iconStyle"></span>

		<span :class="textClass">{{ text }}</span>

	</a>

</template>

<script setup>

	import { computed, nextTick, onMounted } from 'vue'

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

	onMounted(() => {
		nextTick(() => {
			// UIkit lo aporta la aplicacion anfitriona; sin la guarda el
			// componente no se puede montar en un entorno de pruebas ni en SSR.
			globalThis.UIkit?.update()
		})
	})

	const iconAttr = computed(() => `icon: ${props.icon}; ratio: ${props.ratio};`)

	const iconStyle = computed(() => ({
		fontSize: (props.ratio * 16) + 'px'
	}))

</script>
