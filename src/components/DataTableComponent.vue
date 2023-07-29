<template>

	<div class="uk-overflow-auto">
	
		<table class="uk-table uk-table-divider">
					    
		    <thead v-if="showTableHeader">
		    
		        <tr>
		            
		            <th 
		            	v-for="head in dataTable.head" 
		            	:key="head.id"
		            	:id="`th_${head.id}`"
		            	@click="sortColumn(head)"
		            	:class="{pointer: head.sortable}">
		            
		            	{{ head.value }}
		            
		            </th>

		            <th 
		            	class="uk-table-shrink" 
		            	v-if="actions"></th>

		        </tr>
		    
		    </thead>

		    <tbody>
		        
		        <tr v-for="body in dataTable.body" :key="body.id">
		            
		        	<td v-for="head in dataTable.head" :key="head.id">

		        		<span 
		        			v-if="head.html" 
		        			v-html="setData(head, body)"></span>

		        		<span v-else>{{ setData(head, body) }}</span>

		        	</td>

		            <td v-if="actions" class="uk-text-right">

		            	<button 
		            		class="uk-button button" 
		            		@click="actionButtonClicked(body.actions)">
					
							<i class="fas fa-cogs"></i>
					
						</button>
						
						<nav-dropdown-component :id="`dropdown_${body.id}`" pos="left">
				
							<li v-for="action in body.actions">

								<template v-if="action.route">

									<icon-route-component
										v-if="action.policy"
		                                :name="action.params.to.name" 
		                                :params="{...action.params.to.params, ...extraParams}"
		                                :icon="action.icon"
		                                :text="action.name" />

		                            <disabled-link-component 
		                            	v-else
		                            	:icon="action.icon"
		                            	:text="action.name"/> 
		                            	
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

				return (typeof head.parser === 'function') ? head.parser(body[head.id]) : body[head.id]

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