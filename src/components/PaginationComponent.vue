<template>

	<ul v-if="length > 3" class="fe-pagination fe-justify-center" fe-mb>

	    <li v-if="firstLink != null">

	    	<a href="#" @click="emit('go', firstLink)">

	    		<span fe-page-prev></span>

	    	</a>

	    </li>

	    <li
	    	v-for="link in middleLinks"
	    	:key="link.label"
	    	:class="{ 'fe-disabled': link.url == null, 'fe-active': link.active, }">

	    	<a href="#" @click="emit('go', link.url)">

	    		{{ link.label }}

	    	</a>

	    </li>

	    <li v-if="lastLink != null">

	    	<a href="#" @click="emit('go', lastLink)">

	    		<span fe-page-next></span>

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

	.fe-pagination > .fe-active > * {
	    color: #666;
	    font-weight: 600;
	    border-bottom: 3px solid var(--primary-color);
	}

</style>
