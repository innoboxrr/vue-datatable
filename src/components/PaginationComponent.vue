<template>

	<ul v-if="length > 3" class="uk-pagination uk-flex-center" uk-margin>

	    <li v-if="firstLink != null">

	    	<a href="#" @click="emit('go', firstLink)">

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

	    	<a href="#" @click="emit('go', link.url)">

	    		{{ link.label }}

	    	</a>

	    </li>

	    <li v-if="lastLink != null">

	    	<a href="#" @click="emit('go', lastLink)">

	    		<span uk-pagination-next></span>

	    	</a>

	    </li>

	</ul>

</template>

<script setup>

	import { computed } from 'vue'

	const props = defineProps({
		links: {
			type: Array,
			required: true,
		}
	})

	const emit = defineEmits(['go'])

	const length = computed(() => props.links.length)

	const firstLink = computed(() => length.value > 0 ? props.links[0].url : null)

	const lastLink = computed(() => {

		const last = props.links[length.value - 1]

		return length.value > 0 && last !== undefined ? last.url : null

	})

	const middleLinks = computed(() => props.links.slice(1, -1))

</script>

<style scoped>

	.uk-pagination > .uk-active > * {
	    color: #666;
	    font-weight: 600;
	    border-bottom: 3px solid var(--primary-color);
	}

</style>
