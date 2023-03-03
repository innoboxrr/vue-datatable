<template>
	
	<a href="#" class="disabled-link" :uk-tooltip="`title: ${ 'This action is not authorized' }; pos:right`">
							
		<span 
			v-if="showIcon"
			class="uk-margin-small-right uk-icon" 
			:uk-icon="icon"></span>

		<span>{{ text }}</span>

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