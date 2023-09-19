<template>
	
	<router-link 
		:to="pathObject"
		class="block px-4 py-2 dark:hover:text-white dark:text-slate-400">
							
		<span 
			class="uk-margin-small-right uk-icon" 
			:uk-icon="iconAttr"
			:style="iconStyle"></span>

		<span :class="textClass">{{ text }}</span>

	</router-link>

</template>


<script>
	
	export default {

		props: {
			name: {
				type: String,
				required: true
			},
			params: {
				type: Object,
				default: {}
			},
			query: {
				type: Object,
				default: {}
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
		},	

		data() {
			return {
				pathObject: {
					name: this.name,
					params: this.params,
					query: this.query
				}
			}
		},

		computed: {

			iconAttr() {

				return `icon: ${this.icon}; ratio: ${this.ratio};`;

			},

			iconStyle() {

				return {
					fontSize: (this.ratio * 16) + 'px'
				}

			}

		}

	}

</script>
