<template>
	<div>
		<div v-if="showTopbar">
			<div class="fe-container fe-container-wide pt-4">
				<div fe-grid>
					<div class="fe-w-expand" v-if="hasActions">
						<button
							class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
							@click="actionButtonClicked(crudActions)">
							Acciones
						</button>
						<NavDropdownComponent id="actionCrudDropdown" pos="right">
							<li v-for="action in crudActions" :key="action.id">
								<template v-if="action.route">
									<IconRouteComponent
										v-if="action.policy"
		                                :name="action.params.to.name"
		                                :params="{...action.params.to.params, ...extraParams}"
		                                :query="action.params.to.query ? {...action.params.to.query, ...extraQuery} : {...extraQuery}"
		                                :icon="action.icon"
		                                :text="action.name" />
		                            <DisabledLinkComponent
		                            	v-else
		                            	:icon="action.icon"
		                            	:text="action.name"/>
								</template>
								<template v-else>
									<IconLinkComponent
										v-if="action.policy"
										:icon="action.icon"
										:text="action.name"
										@click="actionClicked(action) , closeDropdown($event)" />
									<DisabledLinkComponent
		                            	v-else
		                            	:icon="action.icon"
		                            	:text="action.name"/>
								</template>
							</li>
						</NavDropdownComponent>
					</div>
					<div v-else>
						<div class="fe-w-expand"></div>
					</div>
					<div v-if="hasFilter" class="fe-w-auto">
						<div class="fe-grid-divider fe-children-expand fe-text-center" fe-grid>
						    <div>
								<button
						    		type="button"
						    		class="fe-text-right pointer"
						    		data-tooltip="Update results"
						    		aria-label="Update results"
						    		@click="updateFilters">
									<svg class="w-6 h-6 text-slate-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20">
										<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 1v5h-5M2 19v-5h5m10-4a8 8 0 0 1-14.947 3.97M1 10a8 8 0 0 1 14.947-3.97"/>
									</svg>
								</button>
						    </div>
							<div>
								<button
						    		type="button"
						    		class="fe-text-right pointer"
						    		data-tooltip="Buscar"
						    		aria-label="Buscar"
						    		:aria-expanded="filtersOpen"
						    		@click="filtersOpen = ! filtersOpen">
									<svg class="w-6 h-6 text-slate-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
										<path d="M18.85 1.1A1.99 1.99 0 0 0 17.063 0H2.937a2 2 0 0 0-1.566 3.242L6.99 9.868 7 14a1 1 0 0 0 .4.8l4 3A1 1 0 0 0 13 17l.01-7.134 5.66-6.676a1.99 1.99 0 0 0 .18-2.09Z"/>
									</svg>
								</button>
						    </div>
						</div>
					</div>
				</div>
			</div>
			<div
				v-if="hasFilter"
				class="filter-form fe-card fe-card-body fe-pt-0"
				:hidden="! filtersOpen">
				<slot name="filterForm"></slot>
			</div>
		</div>
		<div
			class="fe-container fe-container-wide"
			:class="{ 'ptb-20': showTopbar }">
			<div
				class="fe-p-sm"
				:class="{ 'bg-white p-6 rounded-lg shadow dark:border-slate-700 dark:bg-slate-800': cardWrapper }">
				<DataTableComponent
					:actions="hasActions"
					:data-table="dataTable"
					:extra-params="extraParams"
					:extra-query="extraQuery"
					:show-table-header="showTableHeader"
					:data-table-components="dataTableComponents"
					@sortColumn="sortColumn"
					@actionButtonClicked="actionButtonClicked"
					@actionClicked="actionClicked" />
				<SelectPaginationComponent
					:meta="pagination.meta"
					:links="pagination.links"
					@updatePage="updatePage" />
			</div>
		</div>
	</div>
</template>

<script setup>

	import { markRaw, onMounted, reactive, ref, watch } from 'vue'
	import axios from 'axios'

	import NavDropdownComponent from './components/NavDropdownComponent.vue'
	import IconRouteComponent from './components/IconRouteComponent.vue'
	import IconLinkComponent from './components/IconLinkComponent.vue'
	import DisabledLinkComponent from './components/DisabledLinkComponent.vue'
	import DataTableComponent from './components/DataTableComponent.vue'
	import SelectPaginationComponent from './components/SelectPaginationComponent.vue'

	const props = defineProps({
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
		// Vue 3 exige factoria en los defaults de objeto y array.
		formFilters: {
			type: Object,
			default: () => ({})
		},
		externalFilters: {
			type: Object,
			default: () => ({})
		},
		extraParams: {
			type: Object,
			default: () => ({})
		},
		extraQuery: {
			type: Object,
			default: () => ({})
		},
		hideColumns: {
			type: Array,
			default: () => []
		},
		cardWrapper: {
			type: Boolean,
			default: true
		},
		showTableHeader: {
			type: Boolean,
			default: true,
		}
	})

	/**
	 * Se leia de la global `csrf_token`, que la aplicacion anfitriona tenia
	 * que definir en window: el componente no se podia montar fuera de ella.
	 */
	// Abrir un panel es estado de componente, no una instruccion al DOM. Antes
	// lo hacia uk-toggle buscando `.filter-form` por selector, que es como la
	// rama Vue y la de React acabaron comportandose distinto.
	const filtersOpen = ref(false)

	const csrfToken = () => globalThis.csrf_token
		?? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
		?? ''

	/**
	 * Sustituye a `_.isEqual` de lodash, que se usaba como global sin
	 * declararla como dependencia.
	 */
	const isEqual = (a, b) => {

		if (a === b) {
			return true
		}

		if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
			return false
		}

		const keysA = Object.keys(a)
		const keysB = Object.keys(b)

		return keysA.length === keysB.length && keysA.every((key) => isEqual(a[key], b[key]))

	}

	const hiddenColumnIds = () => props.hideColumns.map(
		// Se admite tanto ['name'] como [{ id: 'name' }]: el contrato nunca
		// estuvo documentado y por ahi circulan las dos formas.
		(column) => typeof column === 'string' ? column : column?.id
	)

	const buildHead = () => {

		const hidden = hiddenColumnIds()

		return props.model.dataTableHead().filter((column) => ! hidden.includes(column.id))

	}

	const registerComponents = () => {

		if (typeof props.model.dataTableComponents !== 'function') {
			return {}
		}

		const declared = props.model.dataTableComponents()

		return Object.keys(declared).reduce((components, key) => {
			components[key] = markRaw(declared[key])

			return components
		}, {})

	}

	const crudActions = ref(props.model.crudActions())

	const dataTable = reactive({
		head: buildHead(),
		body: [],
	})

	const pagination = reactive({
		meta: [],
		links: [],
	})

	const dataTableComponents = registerComponents()

	const sort = reactive(props.model.dataTableSort())

	const orderBy = ref('id')
	const internalSort = ref(false)
	const page = ref(1)

	let fetchDataAttempts = 0
	let fetchPoliciesAttempts = 0

	const getFilters = () => {

		const params = {
			_token: csrfToken(),
			managed: true,
			except_view_any: true,
		}

		const order = {
			orderBy: orderBy.value,
			orderMode: sort[orderBy.value],
		}

		// Con orden interno, el del usuario gana a lo que traigan los filtros
		// externos; sin el, es al reves.
		return internalSort.value
			? { ...params, ...props.formFilters, ...props.externalFilters, ...order, page: page.value }
			: { ...params, ...props.formFilters, ...order, ...props.externalFilters, page: page.value }

	}

	const fetchData = () => {

		const filters = getFilters()

		return axios({
			method: props.dataMethod,
			url: props.dataUrl,
			data: props.dataMethod === 'post' ? filters : null,
			params: props.dataMethod === 'get' ? filters : null,
		}).then((res) => {

			fetchDataAttempts = 0
			dataTable.body = res.data.data
			pagination.meta = res.data.meta
			pagination.links = res.data.links

		}).catch((error) => {

			// Un fallo de red no trae respuesta: leer error.response.status
			// sin comprobarlo lanzaba un TypeError dentro del propio manejador.
			if (error.response?.status === 403) {
				return
			}

			if (fetchDataAttempts <= 3) {
				setTimeout(() => {
					++fetchDataAttempts
					fetchData()
				}, 1500)
			}

		})

	}

	const updateFilters = () => {
		props.model.setFilters(getFilters())

		return fetchData()
	}

	const sortColumn = (column) => {

		if (column.sortable !== true) {
			return
		}

		// A partir de aqui el orden elegido por el usuario manda sobre el que
		// puedan traer los filtros externos.
		internalSort.value = true
		orderBy.value = column.id
		sort[column.id] = sort[column.id] === 'asc' ? 'desc' : 'asc'

		updateFilters()

	}

	const updatePage = (newPage) => {
		page.value = newPage

		updateFilters()
	}

	const actionClicked = (action) => {
		return props.model[action.callback](action.params)
			.then(() => updateFilters())
			.catch((error) => console.error(error))
	}

	const actionButtonClicked = (actions) => {

		const requestData = {
			_token: csrfToken(),
			id: actions[0]?.params?.id ?? null,
		}

		return axios({
			method: props.policyMethod,
			url: props.policyUrl,
			data: props.policyMethod === 'post' ? requestData : null,
			params: props.policyMethod === 'get' ? requestData : null,
		}).then((res) => {

			fetchPoliciesAttempts = 0

			actions.forEach((action) => {
				if (res.data[action.id]) {
					action.policy = true
				}
			})

		}).catch(() => {

			if (fetchPoliciesAttempts <= 3) {
				setTimeout(() => {
					++fetchPoliciesAttempts
					actionButtonClicked(actions)
				}, 1500)

				return
			}

			setTimeout(() => {
				fetchPoliciesAttempts = 0
			}, 3000)

		})

	}

	// Un popover se cierra solo: no hace falta preguntarle nada a nadie.
	const closeDropdown = (event) => {
		event.target.closest('[popover]')?.hidePopover()
	}

	watch(() => props.formFilters, () => {
		page.value = 1
		updateFilters()
	}, { deep: true })

	watch(() => props.externalFilters, (value, previous) => {
		if (! isEqual(value, previous)) {
			updateFilters()
		}
	}, { deep: true })

	onMounted(fetchData)

	// El test y el anfitrion consultan el estado de las acciones; con
	// <script setup> los bindings son privados si no se exponen.
	defineExpose({ crudActions, dataTable, pagination })

</script>

<style scoped>
	.tools-icon {
		font-size: 30px;
		color: var(--secondary-color);
	    padding: 10px 15px;
	}
</style>
