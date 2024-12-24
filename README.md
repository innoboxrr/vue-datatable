
# InnoboxRR Vue DataTable

**InnoboxRR Vue DataTable** es un paquete avanzado para manejar tablas de datos en aplicaciones Vue 3, con soporte para filtros, ordenación, paginación, personalización de columnas y componentes dinámicos. Este README incluye instrucciones detalladas para configurar tanto el entorno Vue como los archivos de configuración necesarios.

---

## Índice

1. [Instalación](#instalación)
2. [Configuración en Vue](#configuración-en-vue)
3. [Archivo de Configuración](#archivo-de-configuración)
4. [Uso de DataTable](#uso-de-datatable)
5. [Personalización](#personalización)
6. [CRUD y Políticas](#crud-y-políticas)
7. [Ejemplo Completo](#ejemplo-completo)

---

## Instalación

### Paso 1: Instalar el paquete

```bash
npm install innoboxrr-vue-datatable innoboxrr-http-request
```

---

## Configuración en Vue

1. **Registrar el paquete:**

```javascript
// main.js
import { createApp } from 'vue';
import App from './App.vue';
import DataTable from 'innoboxrr-vue-datatable';

const app = createApp(App);
app.component('DataTable', DataTable);
app.mount('#app');
```

2. **Registrar los componentes globales necesarios:**

```javascript
// main.js
import ClipboardInput from './components/ClipboardInput.vue';

app.component('ClipboardInput', ClipboardInput);
```

---

## Archivo de Configuración

Crea un archivo de configuración, por ejemplo, `dataTableConfig.js`, para centralizar la lógica asociada a tus tablas y modelos.

```javascript
import makeHttpRequest from 'innoboxrr-http-request';
import ClipboardInput from '@components/ClipboardInput.vue';

export const API_ROUTE_PREFIX = 'api.example.';
export const CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

export let filters = {};

export const strings = {
  crudActions: {
    create: { name: 'Create', icon: 'fa-plus' },
    export: { name: 'Export', icon: 'fa-download' },
  },
};

export const setFilters = (newFilters = {}) => {
  filters = { ...filters, ...newFilters };
  return filters;
};

export const getFilters = () => filters;

export const crudActions = () => [
  {
    id: 'create',
    name: strings.crudActions.create.name,
    callback: 'createModel',
    icon: strings.crudActions.create.icon,
    route: true,
    params: { to: { name: 'CreateExample', params: {} } },
  },
];

export const dataTableComponents = () => ({
  ClipboardInput,
});

export const dataTableHead = () => [
  { id: 'id', value: 'ID', sortable: true },
  { id: 'name', value: 'Name', sortable: true },
  { id: 'description', value: 'Description', sortable: false },
  { id: 'link', value: 'Link', component: 'ClipboardInput', parser: (value) => ({ value }) },
];

export const dataTableSort = () => ({
  id: 'asc',
  name: 'asc',
});

export const indexModel = (filters = {}) =>
  makeHttpRequest('get', route(API_ROUTE_PREFIX + 'index'), { _token: CSRF_TOKEN, ...filters });

export const createModel = (data) =>
  makeHttpRequest('post', route(API_ROUTE_PREFIX + 'create'), { _token: CSRF_TOKEN, ...data });
```

---

## Uso de DataTable

```vue
<template>
  <data-table
    title="Example Table"
    :data-url="dataUrl"
    data-method="get"
    :model="model"
    :external-filters="externalFilters"
    :form-filters="formFilters"
    :extra-params="extraParams"
    :hide-columns="hideColumns"
    :has-actions="true"
    :has-filter="true"
  >
    <template v-slot:filterForm>
      <filter-form @submit="updateFormFilters" />
    </template>
  </data-table>
</template>

<script>
import DataTable from 'innoboxrr-vue-datatable';
import FilterForm from './FilterForm.vue';
import * as model from './dataTableConfig';

export default {
  components: { DataTable, FilterForm },
  data() {
    return {
      dataUrl: '/api/example',
      model,
      externalFilters: {},
      formFilters: {},
      extraParams: {},
      hideColumns: [],
    };
  },
  methods: {
    updateFormFilters(filters) {
      this.formFilters = filters;
    },
  },
};
</script>
```

---

## Personalización

1. **Cabezeras de tabla (dataTableHead):**
   Define las columnas de la tabla en el archivo de configuración.
   
2. **Filtros externos e internos:**
   Usa `formFilters` para los filtros internos y `externalFilters` para filtros definidos fuera del componente.

3. **Componentes personalizados:**
   Registra componentes como `ClipboardInput` para columnas dinámicas.

---

## CRUD y Políticas

1. **Definir acciones CRUD (crudActions):**
   Asigna iconos, nombres y rutas a las acciones.

2. **Petición de datos:**
   Usa funciones como `indexModel` y `createModel` para interactuar con el backend.

3. **Políticas:**
   Integra validaciones de acceso por políticas usando rutas predefinidas.

---

## Ejemplo Completo

Revisa la sección de ejemplos en los apartados anteriores. 
Para más información, consulta la [documentación oficial del paquete](https://github.com/innoboxrr/vue-datatable).
