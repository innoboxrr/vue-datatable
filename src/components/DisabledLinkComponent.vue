<template>

	<a
		href="#"
		class="disabled-link block px-4 py-2 dark:hover:text-white dark:text-slate-400"
		:uk-tooltip="`title: ${ 'This action is not authorized' }; pos:right`">

		<Icon
			v-if="showIcon"
			class="fe-mr-sm"
			:icon="resolved"
			aria-hidden="true" />

		<span>{{ text }}</span>

	</a>

</template>

<script setup>

	import { computed } from 'vue'
	import { Icon } from '@iconify/vue'
	import { iconFor } from 'innoboxrr-form-core'

	const props = defineProps({

		icon: {
			type: String,
			default: ''
		},

		text: {
			type: String,
			required: true
		}

	})

	const showIcon = computed(() => props.icon !== '' && props.icon != null)

	const resolved = computed(() => iconFor(props.icon))

</script>
