<template>

	<div class="pagination" uk-grid>

		<div class="uk-width-auto">

			<ul class="uk-pagination uk-flex-left uk-margin-medium-top" uk-margin>

			    <li>

			    	<span v-if="meta.total > 0">

			    		{{ 'Showing' }} {{ meta.from }} {{ 'to' }} {{ meta.to }} {{ 'of' }} {{ meta.total }} {{ 'entries' }}

			    	</span>

			    	<span v-else>{{ ('No results found') }}</span>

			    </li>

			</ul>

		</div>

		<div class="uk-width-expand">

			<ul class="uk-pagination uk-flex-right uk-margin-medium-top" uk-margin>

			    <!-- Prev -->
			    <li v-if="currentPage > 1">

			    	<a href="#" @click="prevPage()">

			    		<span uk-pagination-previous></span>

			    	</a>

			    </li>

			    <li>
			    	<select
			    		class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
			    		v-model="currentPage">

			    		<option
			    			v-for="page in meta.last_page"
			    			:key="'page_' + page"
			    			:value="page">{{ page }}</option>

			    	</select>
			    </li>

			    <!-- Next -->
			    <li v-if="currentPage < meta.last_page">

			    	<a href="#" @click="nextPage()">

			    		<span uk-pagination-next></span>

			    	</a>

			    </li>

			</ul>

		</div>

	</div>

</template>

<script setup>

	import { ref, watch } from 'vue'

	const props = defineProps({

		meta: {
			type: Object,
			required: true
		},

		links: {
			type: Object,
			required: true
		}

	})

	const emit = defineEmits(['updatePage'])

	const currentPage = ref(props.meta.current_page ?? 1)

	// El select nacia siempre en 1 y no se enteraba de los cambios de pagina
	// hechos desde fuera (por ejemplo al reiniciar los filtros).
	watch(() => props.meta.current_page, (page) => {

		if (page != null && page !== currentPage.value) {
			currentPage.value = page
		}

	})

	watch(currentPage, (page) => emit('updatePage', page))

	const prevPage = () => currentPage.value--

	const nextPage = () => currentPage.value++

</script>
