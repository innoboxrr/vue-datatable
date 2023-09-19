<template>
	
	<div>

		<div v-if="showTopbar">

			<!-- Tools -->
			<div class="uk-card uk-card-body">

				<div uk-grid>
					
					<!-- Actions -->
					<div class="uk-width-expand@m" v-if="hasActions">
							
						<!-- Action Button-->
						<button 
							class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
							@click="actionButtonClicked(crudActions)">
							
							Acciones

						</button>

						<!-- Dropdown Actions-->
						<nav-dropdown-component id="actionCrudDropdown" pos="right">

							<li v-for="action in crudActions" :key="action.id">

								<template v-if="action.route">

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

								<template v-else>

									<icon-link-component 
										v-if="action.policy"
										:icon="action.icon"
										:text="action.name" 
										@click="actionClicked(action) , closeDropdown($event)" />

									<disabled-link-component 
		                            	v-else
		                            	:icon="action.icon"
		                            	:text="action.name"/> 

								</template>

							</li>

						</nav-dropdown-component>

					</div>

					<div v-if="hasFilter" class="uk-width-auto@m">
						
						<div class="uk-grid-divider uk-child-width-expand uk-text-center" uk-grid>

						    <div>
								
								<span 
						    		class="uk-text-right pointer"
						    		:uk-tooltip="`title: ${'Update results'}`"
						    		@click="updateFilters">
								
									<svg class="w-6 h-6 text-slate-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20">
									<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 1v5h-5M2 19v-5h5m10-4a8 8 0 0 1-14.947 3.97M1 10a8 8 0 0 1 14.947-3.97"/>
									</svg>
								
								</span>

						    </div>

						    <!-- Filter -->
							<div>
								
								<span 
						    		class="uk-text-right pointer" 
						    		uk-toggle="target: .filter-form; animation: uk-animation-scale-up;"
						    		uk-tooltip="title: Buscar">
								
									<svg class="w-6 h-6 text-slate-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
									<path d="M18.85 1.1A1.99 1.99 0 0 0 17.063 0H2.937a2 2 0 0 0-1.566 3.242L6.99 9.868 7 14a1 1 0 0 0 .4.8l4 3A1 1 0 0 0 13 17l.01-7.134 5.66-6.676a1.99 1.99 0 0 0 .18-2.09Z"/>
									</svg>
								
								</span>

						    </div>

						</div>

					</div>

				</div>

			</div>

			<!-- Filter Form-->
			<div 
				v-if="hasFilter"
				class="filter-form uk-card uk-card-body uk-padding-remove-top" 
				hidden>
				
				<slot name="filterForm"></slot>

			</div>

		</div>

		<!-- Table -->
		<div 
			class="uk-container uk-container-expand"
			:class="{
				'ptb-20': showTopbar
			}">

			<div 
				class="uk-card uk-card-body p-6 bg-white border border-slate-200 rounded-lg shadow dark:bg-slate-800 dark:border-slate-700 uk-padding-remove"
				:class="{
					'uk-card-default': cardWrapper
				}">
				
				<data-table-component
					:actions="hasActions"
					:data-table="dataTable"
					:extra-params="extraParams"
					:show-table-header="showTableHeader"
					@sortColumn="sortColumn"
					@actionButtonClicked="actionButtonClicked"
					@actionClicked="actionClicked" />

				<select-pagination-component
					:meta="pagination.meta"
					:links="pagination.links"
					@updatePage="updatePage" />

			</div>

		</div>

	</div>

</template>

<script>

	import NavDropdownComponent from './components/NavDropdownComponent.vue'
	import IconRouteComponent from './components/IconRouteComponent.vue'
	import IconLinkComponent from './components/IconLinkComponent.vue'
	import DisabledLinkComponent from './components/DisabledLinkComponent.vue'
	import DataTableComponent from './components/DataTableComponent.vue'
	import SelectPaginationComponent from './components/SelectPaginationComponent.vue'
	
	export default {

		components: {
			
			NavDropdownComponent,
			
			IconRouteComponent,
			
			IconLinkComponent,
			
			DisabledLinkComponent,
			
			DataTableComponent,
			
			SelectPaginationComponent

		},

		props: {

			dataUrl: {
				type: String,
				required: true
			},

			dataMethod: {
				type: String,
				default: 'post',
			},

			model: {
				type: Object,
				required: true
			},

			policyUrl: {
				type: String,
				required: true
			},

			policyMethod: {
				type: String,
				default: 'post'
			},

			showTopbar:{
				type: Boolean,
				default: true
			},

			hasActions: {
				type: Boolean,
				default: true,
			},

			hasFilter: {
				type: Boolean,
				default: true,
			},

			formFilters: {
				type: Object,
				default: {}
			},

			externalFilters: {
				type: Object,
				default: {}
			},

			extraParams: {
				type: Object,
				default: {}
			},

			hideColumns: {
				type: Array,
				default: []
			},

			cardWrapper: {
				type: Boolean,
				default: true
			},

			showTableHeader: {
				type: Boolean,
				default: true,
			}

		},

		mounted() {

			this.fetchData();

		},

		data() {

			return {
			
				crudActions: this.model.crudActions(),
			
				dataTable: {
					
					head: this.dataTableHead(),

					body: []

				},
			
				pagination: {
					
					meta: [],
					
					links: []

				},
			
				sort: this.model.dataTableSort(),
			
				orderBy: 'id',

				internalSort: false,
			
				page: 1,
			
				fetchDataAttempts: 0,

				fetchPoliciesAttempts: 0,
			
			}

		},

		watch: {

			formFilters: {

				handler(val, oldVal) {

					this.page = 1;

			    	this.updateFilters();

			    },

			    deep: true

			},

			externalFilters: {

				handler(val, oldVal) {

					if(!_.isEqual(val, oldVal)) this.updateFilters();

			    },

			    deep: true

			}

		},

		methods: {

			dataTableHead() {

				// NOTA: En este punto puede existir una oportunidad para sobreescribir las columnas del datatable

				let cols = this.model.dataTableHead();

				let rm = this.hideColumns;

				for( let i = cols.length - 1; i >= 0; i--) {

				 	for( let j = 0; j < rm.length; j++) {
				 	
				 	    if(cols[i] && (cols[i].id === rm[j].id)){
				    
				    		cols.splice(i, 1);
				    
				    	}
				    
				    }

				}

				return cols;

			},

			fetchData() {
				
				const requestData = {

					method: this.dataMethod,

					url: this.dataUrl,

					data: this.dataMethod === 'post' ? this.getFilters() : null,

					params: this.dataMethod === 'get' ? this.getFilters() : null

				};
				
				axios(requestData).then(res => {

					this.fetchDataAttempts = 0;

					this.dataTable.body = res.data.data;

					this.pagination.meta = res.data.meta;

					this.pagination.links = res.data.links;

				}).catch(error => {

					if (error.response.status === 403) {

						// this.$router.push({name: "NotAuthorized" });

					} else {

						if (this.fetchDataAttempts <= 3) {

							setTimeout(() => {

								++this.fetchDataAttempts;

								this.fetchData();

							}, 1500);

						}

					}

				});
			},

			getFilters() {

				let formFilters = this.formFilters;

				let params = {
					_token: csrf_token,
					managed: true,
					except_view_any: true,
				}

				let order = {
					orderBy: this.orderBy,
					orderMode: this.sort[this.orderBy]
				}

				let page = {
					page: this.page
				}

				let filters = {};

				if(this.internalSort) {

					filters = {
						...params,
						...formFilters,
						...this.externalFilters,
						...order,
						...page
					}

				} else {

					filters = {
						...params,
						...formFilters,
						...order,
						...this.externalFilters,
						...page
					}

				}

				return filters;

			},

			updateFilters() {

				this.model.setFilters(this.getFilters());

				this.fetchData();

			},

			sortColumn(data) {

				if(data.sortable == true) {

					// Esto hace que se haga caso omiso a la ordenación de externalFilters
					this.internalSort = true;

					let column_id = data.id;

					// Determinar la columan que va a ordenar los resultados
					this.orderBy = column_id;

					// Encontrar el orden actual
					let order = (this.sort[column_id] == 'asc') ? 'desc' : 'asc';

					// Determinar el nuevo orden para la columna dada
					this.sort[column_id] = order;

					// Solicitar los datos
					this.updateFilters();
					
				}

			},

			updatePage(page) {

				this.page = page;

				this.updateFilters();

			},

			actionClicked(action) {

				this.model[action.callback](action.params).then( res => {

					this.updateFilters();

				}).catch( error => {

					console.error(error);

				});

			},

			actionButtonClicked(actions) {

				const id = actions[0].params.id;

				const requestData = {

					_token: csrf_token,

					id: id

				};

				const requestConfig = {

					method: this.policyMethod,

					url: this.policyUrl,

					data: this.policyMethod === 'post' ? requestData : null,

					params: this.policyMethod === 'get' ? requestData : null

				};

				axios(requestConfig).then(res => {

					this.fetchPoliciesAttempts = 0;

					const policies = res.data;

					actions.forEach(action => {

						if (policies[action.id]) {

							action.policy = true;

						}

					});

				}).catch(error => {

					if (this.fetchPoliciesAttempts <= 3) {

						setTimeout(() => {

							++this.fetchPoliciesAttempts;

							this.actionButtonClicked(actions);

						}, 1500);

					} else {

						setTimeout(() => {

							this.fetchPoliciesAttempts = 0;

						}, 3000);

					}

				});

			},

			closeDropdown(event){
			
				let dropdown = event.target.closest('.uk-dropdown');

				UIkit.dropdown(dropdown).hide(false);

			}

		}

	}

</script>

<style scoped>
	
	.tools-icon {
		font-size: 30px;
		color: var(--secondary-color);
	    padding: 10px 15px;
	}

</style>