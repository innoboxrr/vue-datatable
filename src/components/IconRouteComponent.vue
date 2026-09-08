<template>

	<router-link
		:to="pathObject"
		class="block px-4 py-2 dark:hover:text-white dark:text-slate-400">

		<Icon
			class="fe-mr-sm"
			:icon="resolved"
			:width="size"
			:height="size"
			aria-hidden="true" />

		<span :class="textClass">{{ text }}</span>

	</router-link>

</template>

<script setup>

	import { computed, onScopeDispose, ref } from 'vue'
	import { Icon } from '@iconify/vue'
	import { iconFor, onIconChange } from 'innoboxrr-form-core'

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
