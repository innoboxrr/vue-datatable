<template>
	
	<ul v-if="length > 3" class="uk-pagination uk-flex-center" uk-margin>
	
	    <li v-if="firstLink != null">

	    	<a href="#" @click="$emit('go', firstLink)">

	    		<span uk-pagination-previous></span>

	    	</a>

	    </li>
	
	    <li 
	    	v-for="link in middleLinks" 
	    	:key="link.label"
	    	:class="{
	    		'uk-disabled': link.url == null,
	    		'uk-active': link.active,
	    	}">

	    	<a href="#" @click="$emit('go', link.url)">

	    		{{ link.label }}

	    	</a>

	    </li>
	
	    <li v-if="lastLink != null">

	    	<a href="#" @click="$emit('go', lastLink)">

	    		<span uk-pagination-next></span>

	    	</a>

	    </li>
	
	</ul>

</template>

<script>
	
	export default {

		props: {
			links: {
				type: Array,
				required: true,
			}
		},

		emits: ['go'],

		computed: {

			length() {

				return this.links.length;

			},

			lastLinkIndex() {

				return this.length - 1;

			},

			firstLink() {

				return (this.length > 0) ? this.links[0].url : null;

			},

			lastLink() {

				return (this.length > 0 && this.links[this.lastLinkIndex] != undefined) ? 
					this.links[this.lastLinkIndex].url : 
					null;

			},

			middleLinks() {

				let auxLinks = this.links;

				let middleLinks = auxLinks.slice(1, -1);

				return middleLinks;

			},

		}

	}

</script>

<style scoped>
	
	.uk-pagination > .uk-active > * {
	    color: #666;
	    font-weight: 600;
	    border-bottom: 3px solid var(--primary-color);
	}

</style>