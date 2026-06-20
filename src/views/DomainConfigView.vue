<script setup>
/**
 * VISTA ADMINISTRATIVA DE GESTIÓN DE CONFIGURACIONES DE DOMINIO
 * 
 * Esta vista permite gestionar las configuraciones de dominios del sistema.
 * 
 * Funcionalidades:
 * - Listar configuraciones con búsqueda
 * - Crear nuevas configuraciones
 * - Editar configuraciones existentes
 * - Activar/Desactivar configuraciones
 * - Eliminar configuraciones
 * 
 * PERMISOS REQUERIDOS:
 * - domain-configs:read - Para listar y ver configuraciones
 * - domain-configs:write - Para crear y actualizar configuraciones
 */

import { ref, computed, onMounted, watch } from 'vue'
import { 
  mdiDomain, 
  mdiPlus, 
  mdiPencil, 
  mdiMagnify,
  mdiRefresh,
  mdiCheckCircle,
  mdiAlertCircle,
  mdiToggleSwitch,
  mdiDelete
} from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import CardBoxModal from '@/components/CardBoxModal.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import CardBoxComponentEmpty from '@/components/CardBoxComponentEmpty.vue'
import { useNotification } from '@/composables/useNotification'
import { useDomainConfigStore } from '@/stores/domainConfig.store'

const domainConfigStore = useDomainConfigStore()
const { notifySuccess, notifyError } = useNotification()

const showFormModal = ref(false)
const isEditing = ref(false)
const editingConfigId = ref(null)

const configForm = ref({
  domain: '',
  is_active: true
})

const searchQuery = ref('')
const showActiveFilter = ref(null)

onMounted(async () => {
  await domainConfigStore.fetchConfigs()
})

watch(searchQuery, () => {
  domainConfigStore.setFilters({
    search: searchQuery.value,
  })
})

watch(
  () => domainConfigStore.error,
  (newError) => {
    if (newError) {
      notifyError(newError, 5000)
      domainConfigStore.error = null
    }
  }
)

watch(
  () => domainConfigStore.successMessage,
  (newMessage) => {
    if (newMessage) {
      notifySuccess(newMessage, 3000)
      domainConfigStore.successMessage = null
    }
  }
)

const openCreateModal = () => {
  isEditing.value = false
  editingConfigId.value = null
  resetForm()
  showFormModal.value = true
}

const openEditModal = (config) => {
  isEditing.value = true
  editingConfigId.value = config.id
  
  configForm.value = {
    domain: config.domain,
    is_active: config.is_active
  }
  
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  isEditing.value = false
  editingConfigId.value = null
  resetForm()
}

const resetForm = () => {
  configForm.value = {
    domain: '',
    is_active: true
  }
}

const saveConfig = async () => {
  try {
    const payload = {
      domain: configForm.value.domain,
      is_active: configForm.value.is_active
    }
    
    if (isEditing.value) {
      await domainConfigStore.updateConfig(editingConfigId.value, payload)
    } else {
      await domainConfigStore.createConfig(payload)
    }
    
    await domainConfigStore.fetchConfigs()
    closeFormModal()
  } catch (error) {
    console.error('Error al guardar configuración:', error)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  showActiveFilter.value = null
  domainConfigStore.clearFilters()
}

const refreshConfigs = async () => {
  await domainConfigStore.fetchConfigs()
}

const changePage = (page) => {
  domainConfigStore.setPage(page)
}

const handleToggleActive = async (config) => {
  try {
    await domainConfigStore.toggleConfigActive(config.id)
  } catch (error) {
    console.error('Error al cambiar estado:', error)
  }
}

const handleDelete = async (configId) => {
  if (confirm('¿Está seguro de eliminar esta configuración?')) {
    try {
      await domainConfigStore.deleteConfig(configId)
    } catch (error) {
      console.error('Error al eliminar:', error)
    }
  }
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :icon="mdiDomain" title="Gestión de Configuraciones de Dominio" main>
        <BaseButton
          :icon="mdiPlus"
          label="Nueva Configuración"
          color="contrast"
          rounded-full
          small
          @click="openCreateModal"
        />
      </SectionTitleLineWithButton>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ domainConfigStore.domainStats.total }}</div>
            <div class="text-sm text-gray-500">Total Configuraciones</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">{{ domainConfigStore.domainStats.active }}</div>
            <div class="text-sm text-gray-500">Activas</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-red-600">{{ domainConfigStore.domainStats.inactive }}</div>
            <div class="text-sm text-gray-500">Inactivas</div>
          </div>
        </CardBox>
      </div>

      <CardBox class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField label="Buscar">
            <FormControl
              v-model="searchQuery"
              :icon="mdiMagnify"
              placeholder="Buscar por dominio..."
            />
          </FormField>
          
          <div class="flex items-end gap-2 md:col-span-2">
            <BaseButton
              :icon="mdiRefresh"
              color="info"
              small
              @click="refreshConfigs"
            />
            <BaseButton
              label="Limpiar Filtros"
              color="info"
              outline
              small
              @click="clearFilters"
            />
          </div>
        </div>
      </CardBox>

      <CardBox class="mb-6" has-table>
        <div v-if="domainConfigStore.isLoading" class="p-8 text-center">
          <div class="text-gray-500">Cargando configuraciones...</div>
        </div>
        
        <template v-else>
          <div v-if="domainConfigStore.paginatedConfigs.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dominio
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="config in domainConfigStore.paginatedConfigs" :key="config.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 font-medium">
                      {{ config.id }}
                    </div>
                  </td>
                  
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span class="text-blue-600 font-semibold text-sm">
                            {{ config.domain?.charAt(0).toUpperCase() || 'D' }}
                          </span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                          {{ config.domain }}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="config.is_active ? 'text-emerald-500' : 'text-red-500'" class="text-sm font-medium">
                      {{ config.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center gap-2">
                      <BaseButton
                        :icon="mdiToggleSwitch"
                        color="info"
                        small
                        :title="config.is_active ? 'Desactivar' : 'Activar'"
                        @click="handleToggleActive(config)"
                      />
                      <BaseButton
                        :icon="mdiPencil"
                        color="info"
                        small
                        @click="openEditModal(config)"
                        title="Editar configuración"
                      />
                      <BaseButton
                        :icon="mdiDelete"
                        color="danger"
                        small
                        @click="handleDelete(config.id)"
                        title="Eliminar configuración"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div class="px-6 py-4 border-t border-gray-200">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="text-sm text-gray-700">
                  Mostrando {{ (domainConfigStore.pagination.currentPage - 1) * domainConfigStore.pagination.pageSize + 1 }} 
                  a {{ Math.min(domainConfigStore.pagination.currentPage * domainConfigStore.pagination.pageSize, domainConfigStore.filteredConfigs.length) }} 
                  de {{ domainConfigStore.filteredConfigs.length }} configuraciones
                </div>
                <div class="flex gap-2">
                  <BaseButton
                    label="Anterior"
                    color="info"
                    outline
                    small
                    :disabled="domainConfigStore.pagination.currentPage === 1"
                    @click="changePage(domainConfigStore.pagination.currentPage - 1)"
                  />
                  <BaseButton
                    label="Siguiente"
                    color="info"
                    outline
                    small
                    :disabled="domainConfigStore.pagination.currentPage >= domainConfigStore.totalPages"
                    @click="changePage(domainConfigStore.pagination.currentPage + 1)"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <CardBoxComponentEmpty v-else />
        </template>
      </CardBox>

      <CardBoxModal
        v-model="showFormModal"
        :title="isEditing ? 'Editar Configuración' : 'Nueva Configuración'"
        :buttonLabel="isEditing ? 'Actualizar' : 'Crear'"
        :isForm="true"
        :isProcessing="domainConfigStore.isLoading"
        :hasCancel="true"
        @confirm="saveConfig"
        @cancel="closeFormModal"
      >
        <div class="space-y-4">
          <FormField label="Dominio" help="Nombre del dominio (ej: example.com)">
            <FormControl 
              v-model="configForm.domain" 
              :icon="mdiDomain" 
              placeholder="example.com"
              required
            />
          </FormField>

          <FormField label="Estado Activo">
            <div class="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                v-model="configForm.is_active"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="is_active" class="text-sm text-gray-700">
                {{ configForm.is_active ? 'Activo' : 'Inactivo' }}
              </label>
            </div>
          </FormField>
        </div>
      </CardBoxModal>
    </SectionMain>
  </LayoutAuthenticated>
</template>