<template>
	
	<div :uk-dropdown="options">

	    <ul class="uk-nav uk-dropdown-nav">

	        <slot></slot>

	    </ul>

	</div>

</template>

<script>
	
	export default {

		props: {
			pos: {
				type: String,
				default: "bottom-left"
			},
			mode: {
				type: String,
				default: "click"
			},
			offset: {
				type: Number,
				default: 0
			},
			animation: {
				type: String,
				default: "uk-animation-slide-top-small"
			},
			duration: {
				type: Number,
				default: 500
			}
		},

		computed: {

			options () {

				return `
					pos: ${this.pos}; 
					mode: ${this.mode};
					offset: ${this.offset};
					animation: ${this.animation};
					duration: ${this.duration};
				`;

			}

		}

	}

</script>