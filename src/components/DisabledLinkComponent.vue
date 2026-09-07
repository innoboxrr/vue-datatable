<template>

	<a
		href="#"
		class="disabled-link block px-4 py-2 dark:hover:text-white dark:text-slate-400"
		:uk-tooltip="`title: ${ 'This action is not authorized' }; pos:right`">

		<span
			v-if="showIcon"
			class="fe-mr-sm uk-icon"
			:uk-icon="icon"></span>

		<span>{{ text }}</span>

	</a>

</template>

<script setup>

	import { computed } from 'vue'

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

</script>
