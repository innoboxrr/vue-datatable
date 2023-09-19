<template>
	
	<a 
		class="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 dark:hover:text-white dark:text-slate-400"
		:href="link" 
		:target="target">
							
		<span 
			class="uk-margin-small-right uk-icon" 
			:uk-icon="iconAttr"
			:style="iconStyle"></span>

		<span :class="textClass">{{ text }}</span>

	</a>

</template>


<script>
	
	export default {

		props: {
			link: {
				type: String,
				default: '#'
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
			target: {
				type: String,
				default: "_self"
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
