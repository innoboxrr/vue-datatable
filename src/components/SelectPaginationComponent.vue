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
			    <li v-if="current_page > 1">
			    	
			    	<a href="#" @click="prevPage()">
			    	
			    		<span uk-pagination-previous></span>
			    	
			    	</a>

			    </li>
			    
			    <li>
			    	<select
			    		class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
			    		v-model="current_page">

			    		<option 
			    			v-for="page in meta.last_page" 
			    			:key="'page_' + page" 
			    			:value="page">{{ page }}</option>

			    	</select>
			    </li>
			    
			    <!-- Next -->
			    <li v-if="current_page < meta.last_page">
			    	
			    	<a href="#" @click="nextPage()">
			    	
			    		<span uk-pagination-next></span>
			    	
			    	</a>

			    </li>

			</ul>

		</div>

	</div>

</template>

<script>
	
	export default {

		props: {
			
			meta: {
				type: Object,
				required: true
			},
			
			links: {
				type: Object,
				required: true
			}

		},

		emits: ['updatePage'],

		data() {

			return {

				current_page: 1,
				
			}

		},

		watch: {

			current_page(newVal, oldVal) {

				this.current_page = newVal;

				this.updatePage();

			}

		},

		methods: {

			prevPage(){

				this.current_page--;

				this.updatePage();

			},

			nextPage(){

				this.current_page++;

				this.updatePage();

			},

			updatePage() {	

				this.$emit('updatePage', this.current_page);

			}

		}

	}

</script>