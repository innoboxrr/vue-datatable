<template>

	<router-link
		:to="pathObject"
		class="block px-4 py-2 dark:hover:text-white dark:text-slate-400">

		<span
			class="fe-mr-sm uk-icon"
			:uk-icon="iconAttr"
			:style="iconStyle"></span>

		<span :class="textClass">{{ text }}</span>

	</router-link>

</template>

<script setup>

	import { computed } from 'vue'

	const props = defineProps({
		name: {
			type: String,
			required: true
		},
		// Vue 3 exige factoria en los defaults de objeto: un literal comparte
		// la misma instancia entre todas las filas de la tabla.
		params: {
			type: Object,
			default: () => ({})
		},
		query: {
			type: Object,
			default: () => ({})
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
	})

	// Estaba en data(), asi que se calculaba una sola vez al crear el
	// componente: al reutilizar la fila para otro registro el enlace seguia
	// apuntando al anterior.
	const pathObject = computed(() => ({
		name: props.name,
		params: props.params,
		query: props.query,
	}))

	const iconAttr = computed(() => `icon: ${props.icon}; ratio: ${props.ratio};`)

	const iconStyle = computed(() => ({
		fontSize: (props.ratio * 16) + 'px'
	}))

</script>
