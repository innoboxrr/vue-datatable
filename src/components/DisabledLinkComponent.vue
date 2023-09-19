<template>
	
	<a 
		href="#" 
		class="disabled-link dark:text-white" 
		:uk-tooltip="`title: ${ 'This action is not authorized' }; pos:right`">
							
		<span 
			v-if="showIcon"
			class="uk-margin-small-right uk-icon dark:text-white" 
			:uk-icon="icon"></span>

		<span class="dark:text-white">{{ text }}</span>

	</a>

</template>

<script>
	
	export default {

		props: {

			icon: {
				type: String,
				default: ''
			},

			text: {
				type: String,
				required: true
			}

		},

		computed: {

			showIcon() {

				return (this.icon != '' && this.icon != undefined);

			}

		}

	}

</script>