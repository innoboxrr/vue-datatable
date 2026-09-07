<template>
	<div class="sm:rounded-lg overflow-x-auto">
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
		            	@click="emit('sortColumn', head)">
		            	{{ head.value }}
		            </th>
		            <th
		            	class="uk-table-shrink"
		            	v-if="actions"></th>
		        </tr>
		    </thead>
		    <tbody>
		        <tr
		        	v-for="(body, rowIndex) in dataTable.body"
		        	:key="body.id"
		        	class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
		        	<td
		        		v-for="head in dataTable.head"
		        		:key="head.id"
		        		class="px-6 py-4">
						<template v-if="head.component">
							<component
								:is="getComponent(head.component)"
								v-bind="setData(head, body, rowIndex)"
								@callback="head.callback && typeof head.callback === 'function' ? head.callback($event, body) : null" />
						</template>
		        		<span
		        			v-else-if="head.html"
		        			class="dark:text-white"
		        			v-html="setData(head, body, rowIndex)"></span>
		        		<span
							v-else
							class="dark:text-white">{{ setData(head, body, rowIndex) }}</span>
		        	</td>
		            <td v-if="actions" class="uk-text-right">
		            	<button
		            		class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-2 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
		            		@click="emit('actionButtonClicked', body.actions)">
							<i class="fas fa-cogs"></i>
						</button>
						<NavDropdownComponent :id="`dropdown_${body.id}`" pos="left">
							<li
								v-for="action in body.actions"
								:key="action.name"
								class="hover:bg-slate-100 dark:hover:bg-slate-600 px-2 py-1">
								<template v-if="action.route && !action?.link">
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
								<template v-else-if="action.route && action.link">
									<IconLinkComponent
										v-if="action.policy"
										:link="action.params.link"
										:target="action.params.target"
										:icon="action.icon"
										:text="action.name" />
								</template>
								<template v-else>
									<IconLinkComponent
										v-if="action.policy"
										:icon="action.icon"
										:text="action.name"
										@click.prevent="emit('actionClicked', action), closeDropdown($event)" />
									<DisabledLinkComponent
		                            	v-else
		                            	:icon="action.icon"
		                            	:text="action.name"/>
								</template>
							</li>
						</NavDropdownComponent>
		            </td>
		        </tr>
		    </tbody>
		</table>
	</div>
</template>

<script setup>

	import { computed } from 'vue'

	import NavDropdownComponent from './NavDropdownComponent.vue'
	import IconRouteComponent from './IconRouteComponent.vue'
	import IconLinkComponent from './IconLinkComponent.vue'
	import DisabledLinkComponent from './DisabledLinkComponent.vue'

	const props = defineProps({
		actions: {
			type: Boolean,
			default: false
		},
		dataTable: {
			type: [Object, Boolean],
			required: true
		},
		// Vue 3 exige factoria en los defaults de objeto.
		extraParams: {
			type: Object,
			default: () => ({})
		},
		extraQuery: {
			type: Object,
			default: () => ({})
		},
		showTableHeader: {
			type: Boolean,
			default: true,
		},
		dataTableComponents: {
			type: Object,
			default: () => ({})
		}
	})

	const emit = defineEmits(['sortColumn', 'actionButtonClicked', 'actionClicked'])

	const getComponent = (componentName) => props.dataTableComponents[componentName] || null

	/**
	 * Copia aislada de cada fila, para que un parser del modelo no pueda
	 * mutar los datos de la tabla.
	 *
	 * Se clonaba con JSON dentro de setData(), es decir una vez por celda: con
	 * 20 filas y 8 columnas eran 160 clonados en cada repintado. Un clon por
	 * fila y repintado deja lo mismo en 20.
	 *
	 * La cache que hacia eso era un WeakMap de modulo, y eso traia dos
	 * problemas propios: la compartian todas las tablas de la pagina, y un
	 * parser que escribiera en su copia la envenenaba para el resto de la vida
	 * de la aplicacion. Una computed sobre el cuerpo da el mismo ahorro sin
	 * ninguna de las dos cosas.
	 */
	const rows = computed(() => (props.dataTable.body ?? []).map(
		(row) => JSON.parse(JSON.stringify(row))
	))

	const setData = (head, body, index) => {

		const data = rows.value[index] ?? body

		return typeof head.parser === 'function' ? head.parser(data[head.id], data) : data[head.id]

	}

	const closeDropdown = (event) => {

		const dropdown = event.target.closest('.uk-dropdown')

		// UIkit lo aporta la aplicacion anfitriona.
		if (dropdown) {
			globalThis.UIkit?.dropdown(dropdown)?.hide(false)
		}

	}

</script>

<style>
	.uk-table td {
	    padding: 12px 14px;
	    vertical-align: middle;
	}
</style>
