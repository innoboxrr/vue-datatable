<template>

	<div
		:id="id"
		ref="panel"
		popover
		:class="classFor('menu')"
		@beforetoggle="onBeforeToggle">

		<ul class="fe-menu-list">

			<slot></slot>

		</ul>

	</div>

</template>

<script setup>

	/**
	 * El menu de acciones de una fila.
	 *
	 * Antes lo movia `uk-dropdown`, que ademas de la clase traia el JavaScript
	 * de UIkit: abrir, cerrar al pulsar fuera, cerrar con Escape, capa
	 * superior y posicionamiento, todo dentro de un framework de 12 MB que
	 * ningun package.json declaraba.
	 *
	 * La mitad de eso ya lo hace el navegador. La **Popover API** —el atributo
	 * `popover` y el `popovertarget` del boton— aporta de fabrica la capa
	 * superior, el cierre al pulsar fuera y el cierre con Escape, sin una
	 * linea de JavaScript. Lo unico que falta es colocarlo, y de eso se ocupa
	 * Floating UI, que son unos 6 kB y es la pieza que usan por debajo Reka
	 * UI, Radix y el propio Flowbite.
	 *
	 * El boton que lo abre solo necesita `popovertarget` con este mismo id:
	 *
	 *     <button :popovertarget="`dropdown_${row.id}`">…</button>
	 *     <NavDropdownComponent :id="`dropdown_${row.id}`" pos="left" />
	 */

	import { computed, ref } from 'vue'
	import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
	import { classFor } from 'innoboxrr-form-core'

	const props = defineProps({
		id: {
			type: String,
			required: true,
		},
		// Se conservan los nombres que usaba UIkit para no romper a quien ya
		// los pasa; `bottom-left` y compania se traducen a los de Floating UI.
		pos: {
			type: String,
			default: 'bottom-left',
		},
		offset: {
			type: Number,
			default: 4,
		},
	})

	const panel = ref(null)

	/** Deja de seguir al disparador cuando el menu se cierra. */
	let stopFollowing = null

	const placement = computed(() => {
		const [side, align] = props.pos.split('-')

		if (! align) {
			return side
		}

		// UIkit dice `bottom-left` para «debajo, alineado a la izquierda»;
		// Floating UI lo llama `bottom-start`.
		return `${side}-${align === 'left' ? 'start' : 'end'}`
	})

	const onBeforeToggle = (event) => {
		if (event.newState !== 'open') {
			stopFollowing?.()
			stopFollowing = null

			return
		}

		// El boton es quien apunta a este panel, asi que se encuentra por el
		// atributo y no hace falta que nadie lo pase como prop.
		const trigger = document.querySelector(`[popovertarget="${props.id}"]`)

		if (! trigger || ! panel.value) {
			return
		}

		// autoUpdate recoloca al hacer scroll o redimensionar: un menu abierto
		// que se queda flotando donde estaba es peor que uno mal colocado.
		stopFollowing = autoUpdate(trigger, panel.value, () => {
			computePosition(trigger, panel.value, {
				placement: placement.value,
				middleware: [
					offset(props.offset),
					// Si no cabe abajo, se va arriba; si se sale por un lado,
					// se desplaza para caber.
					flip(),
					shift({ padding: 8 }),
				],
			}).then(({ x, y }) => {
				Object.assign(panel.value.style, {
					left: `${x}px`,
					top: `${y}px`,
				})
			})
		})
	}

</script>
