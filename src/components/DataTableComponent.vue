<template>

	<div class="relative sm:rounded-lg overflow-x-auto">
	
		<table class="min-w-full w-full text-sm text-left text-slate-500 dark:text-slate-400 p-4 ">
					    
		    <thead 
		    	v-if="showTableHeader"
		    	class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 rounded-sm">
		    
		        <tr>
		            
		            <th 
		            	v-for="head in dataTable.head" 
		            	:key="head.id"
		            	:id="`th_${head.id}`"
		            	class="px-6 py-3"
		            	scope="col" 
		            	:class="{pointer: head.sortable}"
		            	@click="sortColumn(head)">
		            
		            	{{ head.value }}
		            
		            </th>

		            <th 
		            	class="uk-table-shrink" 
		            	v-if="actions"></th>

		        </tr>
		    
		    </thead>

		    <tbody>
		        
		        <tr 
		        	v-for="body in dataTable.body" 
		        	:key="body.id"
		        	class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
		            
		        	<td 
		        		v-for="head in dataTable.head" 
		        		:key="head.id"
		        		class="px-6 py-4">

		        		<span 
		        			v-if="head.html" 
		        			class="dark:text-white" 
		        			v-html="setData(head, body)"></span>

		        		<span v-else class="dark:text-white">{{ setData(head, body) }}</span>

		        	</td>

		            <td v-if="actions" class="uk-text-right">

		            	<button 
		            		class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-2 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800" 
		            		@click="actionButtonClicked(body.actions)">
					
							<i class="fas fa-cogs"></i>
					
						</button>
						
						<nav-dropdown-component :id="`dropdown_${body.id}`" pos="left">
				
							<li 
								v-for="action in body.actions"
								:key="action.name"
								class="hover:bg-slate-100 dark:hover:bg-slate-600 px-2 py-1">

								<template v-if="action.route && !action?.link">

									<icon-route-component
										v-if="action.policy"
		                                :name="action.params.to.name" 
		                                :params="{...action.params.to.params, ...extraParams}"
		                                :query="action.params.to.query ? {...action.params.to.query} : null"
		                                :icon="action.icon"
		                                :text="action.name" />

		                            <disabled-link-component 
		                            	v-else
		                            	:icon="action.icon"
		                            	:text="action.name"/> 
		                            	
								</template>

								<template v-else-if="action.route && action.link">

									<icon-link-component 
										v-if="action.policy"
										:link="action.params.link"
										:target="action.params.target"
										:icon="action.icon"
										:text="action.name" />

								</template>

								<template v-else>

									<icon-link-component 
										v-if="action.policy"
										:icon="action.icon"
										:text="action.name" 
										@click="actionClicked(action), closeDropdown($event)" />

									<disabled-link-component 
		                            	v-else
		                            	:icon="action.icon"
		                            	:text="action.name"/> 

								</template>

							</li>

						</nav-dropdown-component>

		            </td>

		        </tr>

		    </tbody>

		</table>

	</div>

</template>

<script>
	
	import NavDropdownComponent from './NavDropdownComponent.vue'
	import IconRouteComponent from './IconRouteComponent.vue'
	import IconLinkComponent from './IconLinkComponent.vue'
	import DisabledLinkComponent from './DisabledLinkComponent.vue'

	export default {

		components: {
			
			NavDropdownComponent,
			
			IconRouteComponent,
			
			IconLinkComponent,
			
			DisabledLinkComponent

		},

		props: {

			actions: {
				type: Boolean,
				default: false
			},

			dataTable: {
				type: [Object, Boolean],
				required: true
			},

			extraParams: {
				type: Object,
				default: {}
			},

			showTableHeader: {
				type: Boolean,
				default: true,
			}

		},

		emits: ['sortColumn', 'actionButtonClicked', 'actionClicked'],

		methods: {

			sortColumn(data) {

				this.$emit('sortColumn', data);

			},

			actionButtonClicked(data) {

				this.$emit('actionButtonClicked', data);

			},

			actionClicked(data) {

				this.$emit('actionClicked', data);

			},

			setData(head, body) {

				return (typeof head.parser === 'function') ? head.parser(body[head.id], body) : body[head.id]

			},

			closeDropdown(event){
			
				let dropdown = event.target.closest('.uk-dropdown');

				UIkit.dropdown(dropdown).hide(false);

			}

		}

	}

</script>

<style>
	
	.uk-table td {
	    padding: 12px 14px;
	    vertical-align: middle;
	}

</style>