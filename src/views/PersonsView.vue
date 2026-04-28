<script setup>
/**
 * VISTA DE GESTIÓN DE PERSONAS (ADMIN)
 * 
 * Esta vista permite a los administradores gestionar todas las personas
 * del sistema. Incluye funcionalidades de:
 * - Listar personas con filtros y paginación
 * - Crear nuevas personas
 * - Editar personas existentes
 * - Desactivar personas
 * - Filtrar por propietario/arrendatario
 * - Filtrar por estado activo
 * - Búsqueda por nombre, email o celular
 * 
 * NOTA: Esta vista es solo para administradores. Requiere permisos:
 * - person:read - Para listar y ver personas
 * - person:write - Para crear, actualizar y desactivar personas
 * 
 * ESTRUCTURA DE UNA PERSONA:
 * - id: Identificador único
 * - casa_apartamento_id: ID de la casa/apartamento asociado
 * - usuario_id: ID del usuario asociado (opcional)
 * - nombres: Nombres de la persona
 * - apellidos: Apellidos de la persona
 * - edad: Edad de la persona
 * - celular: Número de celular (opcional)
 * - email: Correo electrónico (opcional)
 * - is_propietario: Si es propietario
 * - is_arrendatario: Si es arrendatario
 * - acepta_terminosycondiciones: Si aceptó términos y condiciones
 * - is_active: Si la persona está activa
 * 
 * RELACIÓN CON USUARIOS:
 * - Una persona puede tener asociado un usuario (usuario_id)
 * - Un usuario puede tener múltiples personas asociadas
 * - La asociación es opcional
 */

import { ref, computed, onMounted, watch } from 'vue'
import { 
  mdiAccountGroup, 
  mdiPlus, 
  mdiPencil, 
  mdiDelete, 
  mdiAccountCheck, 
  mdiAccountOff,
  mdiMagnify,
  mdiFilter,
  mdiRefresh,
  mdiAccount,
  mdiEmail,
  mdiPhone,
  mdiCalendar,
  mdiHome,
  mdiAccountStar,
  mdiAccountKey,
  mdiCheckCircle,
  mdiAlertCircle,
  mdiAccountArrowRight
} from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseButtons from '@/components/BaseButtons.vue'
import BaseDivider from '@/components/BaseDivider.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import NotificationBar from '@/components/NotificationBar.vue'
import CardBoxComponentEmpty from '@/components/CardBoxComponentEmpty.vue'
import { usePersonsStore } from '@/stores/persons.store'
import { useUsersStore } from '@/stores/users.store'

// ============================================
// STORES
// ============================================
const personsStore = usePersonsStore()
const usersStore = useUsersStore()

// ============================================
// ESTADO LOCAL
// ============================================

// Modal de confirmación de desactivación
const showDeactivateModal = ref(false)
const personToDeactivate = ref(null)

// Modal de creación/edición
const showFormModal = ref(false)
const isEditing = ref(false)
const editingPersonId = ref(null)

// Formulario de persona
const personForm = ref({
  casa_apartamento_id: null,
  usuario_id: null,
  nombres: '',
  apellidos: '',
  edad: null,
  celular: '',
  email: '',
  is_propietario: false,
  is_arrendatario: false,
  acepta_terminosycondiciones: false,
})

// Filtros
const searchQuery = ref('')
const selectedPropietario = ref(null)
const selectedArrendatario = ref(null)
const showActiveOnly = ref(true)

// ============================================
// COMPUTED
// ============================================

// Opciones para filtro de propietario
const selectPropietarioOptions = [
  { id: null, label: 'Todos' },
  { id: true, label: 'Propietario' },
  { id: false, label: 'No Propietario' },
]

// Opciones para filtro de arrendatario
const selectArrendatarioOptions = [
  { id: null, label: 'Todos' },
  { id: true, label: 'Arrendatario' },
  { id: false, label: 'No Arrendatario' },
]

// Personas filtradas y paginadas
const filteredPersons = computed(() => {
  return personsStore.filteredPersons
})

const paginatedPersons = computed(() => {
  return personsStore.paginatedPersons
})

// Estadísticas de personas
const personStats = computed(() => {
  return personsStore.personStats
})

// Lista de usuarios para relacionar con persona
const selectUserOptions = computed(() => {
  return usersStore.usersList.map(user => ({
    id: user.id,
    label: `${user.first_name} ${user.last_name} (${user.username})`,
  }))
})

// Verificar si el usuario actual es admin
const isAdmin = computed(() => {
  return personsStore.isAdmin
})

// ============================================
// CICLO DE VIDA
// ============================================

onMounted(async () => {
  // Cargar personas y usuarios al montar el componente
  await personsStore.fetchPersons()
  await usersStore.fetchUsers()
})

// ============================================
// WATCHERS
// ============================================

// Aplicar filtros cuando cambien
watch([searchQuery, selectedPropietario, selectedArrendatario, showActiveOnly], () => {
  personsStore.setFilters({
    search: searchQuery.value,
    isPropietario: selectedPropietario.value,
    isArrendatario: selectedArrendatario.value,
    activeOnly: showActiveOnly.value,
  })
})

// ============================================
// FUNCIONES - MODAL DE FORMULARIO
// ============================================

/**
 * Abre el modal para crear una nueva persona
 */
const openCreateModal = () => {
  isEditing.value = false
  editingPersonId.value = null
  resetForm()
  showFormModal.value = true
}

/**
 * Abre el modal para editar una persona existente
 * @param {Object} person - Persona a editar
 */
const openEditModal = (person) => {
  isEditing.value = true
  editingPersonId.value = person.id
  
  // Llenar el formulario con los datos de la persona
  personForm.value = {
    casa_apartamento_id: person.casa_apartamento_id,
    usuario_id: person.usuario_id,
    nombres: person.nombres,
    apellidos: person.apellidos,
    edad: person.edad,
    celular: person.celular || '',
    email: person.email || '',
    is_propietario: person.is_propietario,
    is_arrendatario: person.is_arrendatario,
    acepta_terminosycondiciones: person.acepta_terminosycondiciones,
  }
  
  showFormModal.value = true
}

/**
 * Cierra el modal de formulario
 */
const closeFormModal = () => {
  showFormModal.value = false
  isEditing.value = false
  editingPersonId.value = null
  resetForm()
}

/**
 * Resetea el formulario
 */
const resetForm = () => {
  personForm.value = {
    casa_apartamento_id: null,
    usuario_id: null,
    nombres: '',
    apellidos: '',
    edad: null,
    celular: '',
    email: '',
    is_propietario: false,
    is_arrendatario: false,
    acepta_terminosycondiciones: false,
  }
}

/**
 * Guarda la persona (crea o actualiza)
 */
const savePerson = async () => {
  // Validación básica de requerimiento de usuario asociado
  if (!personForm.value.usuario_id) {
    personsStore.error = 'La persona debe estar asociada a un usuario.'
    personsStore.successMessage = null
    return
  }

  try {
    const payload = {
      ...personForm.value,
      // Si la persona_id viene como objeto desde el select, extraemos el ID
      usuario_id:
        personForm.value.usuario_id && typeof personForm.value.usuario_id === 'object'
          ? personForm.value.usuario_id.id
          : personForm.value.usuario_id,
      // Forzar valores numéricos para los campos que lo requieren
      casa_apartamento_id: personForm.value.casa_apartamento_id ? Number(personForm.value.casa_apartamento_id) : null,
      edad: personForm.value.edad ? Number(personForm.value.edad) : null,
    }

    if (!payload.usuario_id) {
      personsStore.error = 'La persona debe estar asociada a un usuario.'
      personsStore.successMessage = null
      return
    }

    if (isEditing.value) {
      // Actualizar persona existente
      await personsStore.updatePerson(editingPersonId.value, payload)
    } else {
      // Crear nueva persona
      await personsStore.createPerson(payload)
    }
    closeFormModal()
  } catch (error) {
    console.error('Error al guardar persona:', error)
    // El mensaje de error ya se maneja en store
  }
}

// ============================================
// FUNCIONES - MODAL DE DESACTIVACIÓN
// ============================================

/**
 * Abre el modal de confirmación de desactivación
 * @param {Object} person - Persona a desactivar
 */
const openDeactivateModal = (person) => {
  personToDeactivate.value = person
  showDeactivateModal.value = true
}

/**
 * Cierra el modal de desactivación
 */
const closeDeactivateModal = () => {
  showDeactivateModal.value = false
  personToDeactivate.value = null
}

/**
 * Confirma la desactivación de la persona
 */
const confirmDeactivate = async () => {
  try {
    await personsStore.deactivatePerson(personToDeactivate.value.id)
    closeDeactivateModal()
  } catch (error) {
    console.error('Error al desactivar persona:', error)
    // El mensaje se muestra en el NotificationBar (personsStore.error)
  }
}

// ============================================
// FUNCIONES - ACCIONES DE PERSONA
// ============================================

/**
 * Activa/Desactiva una persona
 * @param {Object} person - Persona
 */
const togglePersonStatus = async (person) => {
  try {
    await personsStore.togglePersonStatus(person.id)
  } catch (error) {
    console.error('Error al cambiar estado:', error)
    // El mensaje se muestra en el NotificationBar (personsStore.error)
  }
}

/**
 * Limpia los filtros de búsqueda
 */
const clearFilters = () => {
  searchQuery.value = ''
  selectedPropietario.value = null
  selectedArrendatario.value = null
  showActiveOnly.value = true
  personsStore.clearFilters()
}

/**
 * Refresca la lista de personas
 */
const refreshPersons = async () => {
  await personsStore.fetchPersons()
}

/**
 * Cambia de página
 * @param {number} page - Número de página
 */
const changePage = (page) => {
  personsStore.setPage(page)
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <div v-if="!isAdmin" class="p-6 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
        <h2 class="text-lg font-semibold text-yellow-800">Acceso denegado</h2>
        <p class="text-sm text-yellow-700">Esta vista solo está disponible para administradores logueados. Por favor, inicia sesión con una cuenta admin.</p>
      </div>
      <div v-else>
      <!-- ========================================
           ENCABEZADO DE LA PÁGINA
           ======================================== -->
      <SectionTitleLineWithButton :icon="mdiAccountGroup" title="Gestión de Personas" main>
        <BaseButton
          v-if="isAdmin"
          :icon="mdiPlus"
          label="Nueva Persona"
          color="contrast"
          rounded-full
          small
          @click="openCreateModal"
        />
      </SectionTitleLineWithButton>

      <!-- ========================================
           ESTADÍSTICAS DE PERSONAS
           ======================================== -->
      <div class="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ personStats.total }}</div>
            <div class="text-sm text-gray-500">Total Personas</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">{{ personStats.active }}</div>
            <div class="text-sm text-gray-500">Activas</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-red-600">{{ personStats.inactive }}</div>
            <div class="text-sm text-gray-500">Inactivas</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">{{ personStats.propietarios }}</div>
            <div class="text-sm text-gray-500">Propietarios</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-orange-600">{{ personStats.arrendatarios }}</div>
            <div class="text-sm text-gray-500">Arrendatarios</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-teal-600">{{ personStats.conUsuario }}</div>
            <div class="text-sm text-gray-500">Con Usuario</div>
          </div>
        </CardBox>
      </div>

      <!-- ========================================
           FILTROS Y BÚSQUEDA
           ======================================== -->
      <CardBox class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <!-- Búsqueda -->
          <FormField label="Buscar">
            <FormControl
              v-model="searchQuery"
              :icon="mdiMagnify"
              placeholder="Buscar por nombre, email, celular..."
            />
          </FormField>
          
          <!-- Filtro por propietario -->
          <FormField label="Filtrar por Propietario">
            <FormControl
              v-model="selectedPropietario"
              :options="selectPropietarioOptions"
              :icon="mdiFilter"
            />
          </FormField>
          
          <!-- Filtro por arrendatario -->
          <FormField label="Filtrar por Arrendatario">
            <FormControl
              v-model="selectedArrendatario"
              :options="selectArrendatarioOptions"
              :icon="mdiFilter"
            />
          </FormField>
          
          <!-- Filtro por estado activo -->
          <FormField label="Mostrar Solo Activos">
            <div class="flex items-center h-10">
              <input
                type="checkbox"
                v-model="showActiveOnly"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="ml-2 text-sm text-gray-700">Solo personas activas</span>
            </div>
          </FormField>
          
          <!-- Botones de acción -->
          <div class="flex items-end gap-2">
            <BaseButton
              :icon="mdiRefresh"
              color="info"
              small
              @click="refreshPersons"
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

      <!-- ========================================
           TABLA DE PERSONAS
           ======================================== -->
      <CardBox class="mb-6" has-table>
        <!-- Mensaje de carga -->
        <div v-if="personsStore.isLoading" class="p-8 text-center">
          <div class="text-gray-500">Cargando personas...</div>
        </div>
        
        <!-- Mensaje de error -->
        <NotificationBar v-else-if="personsStore.error" color="danger" :icon="mdiAlertCircle">
          {{ personsStore.error }}
        </NotificationBar>
        
        <!-- Mensaje de éxito -->
        <NotificationBar v-else-if="personsStore.successMessage" color="success" :icon="mdiCheckCircle">
          {{ personsStore.successMessage }}
        </NotificationBar>
        
        <!-- Tabla de personas -->
        <div v-else-if="paginatedPersons.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persona
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Edad
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Casa/Apto
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
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
              <tr v-for="person in paginatedPersons" :key="person.id" class="hover:bg-gray-50">
                <!-- Persona -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-blue-600 font-semibold text-sm">
                          {{ person.nombres?.charAt(0) || '' }}{{ person.apellidos?.charAt(0) || '' }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ person.nombres }} {{ person.apellidos }}
                      </div>
                      <div class="text-sm text-gray-500">
                        ID: {{ person.id }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <!-- Contacto -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="person.email" class="text-sm text-gray-900 flex items-center gap-1">
                    <span :icon="mdiEmail" class="w-4 h-4" />
                    {{ person.email }}
                  </div>
                  <div v-if="person.celular" class="text-sm text-gray-500 flex items-center gap-1">
                    <span :icon="mdiPhone" class="w-4 h-4" />
                    {{ person.celular }}
                  </div>
                  <div v-if="!person.email && !person.celular" class="text-sm text-gray-400">
                    Sin contacto
                  </div>
                </td>
                
                <!-- Edad -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 flex items-center gap-1">
                    <span :icon="mdiCalendar" class="w-4 h-4" />
                    {{ person.edad }} años
                  </div>
                </td>
                
                <!-- Tipo -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="person.tipoPersonaClass" class="px-2 py-1 text-xs font-medium rounded-full">
                    {{ person.tipoPersona }}
                  </span>
                </td>
                
                <!-- Casa/Apartamento -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 flex items-center gap-1">
                    <span :icon="mdiHome" class="w-4 h-4" />
                    {{ person.casa_apartamento_id }}
                  </div>
                </td>
                
                <!-- Usuario -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="person.usuario_id" class="text-sm text-gray-900 flex items-center gap-1">
                    <span :icon="mdiAccountKey" class="w-4 h-4" />
                    Usuario #{{ person.usuario_id }}
                  </div>
                  <div v-else class="text-sm text-gray-400">
                    Sin usuario
                  </div>
                </td>
                
                <!-- Estado -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="person.statusClass" class="text-sm font-medium">
                    {{ person.statusText }}
                  </span>
                </td>
                
                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center gap-2">
                    <!-- Botón Editar -->
                    <BaseButton
                      v-if="isAdmin"
                      :icon="mdiPencil"
                      color="info"
                      small
                      @click="openEditModal(person)"
                    />
                    
                    <!-- Botón Activar/Desactivar -->
                    <BaseButton
                      v-if="isAdmin"
                      :icon="person.is_active ? mdiAccountOff : mdiAccountCheck"
                      :color="person.is_active ? 'danger' : 'success'"
                      small
                      @click="togglePersonStatus(person)"
                    />
                    
                    <!-- Botón Desactivar -->
                    <BaseButton
                      v-if="isAdmin && person.is_active"
                      :icon="mdiDelete"
                      color="danger"
                      small
                      @click="openDeactivateModal(person)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Mensaje cuando no hay personas -->
        <CardBoxComponentEmpty v-else />
        
        <!-- Paginación -->
        <div v-if="paginatedPersons.length > 0" class="px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-500">
              Mostrando {{ (personsStore.pagination.currentPage - 1) * personsStore.pagination.pageSize + 1 }} 
              a {{ Math.min(personsStore.pagination.currentPage * personsStore.pagination.pageSize, filteredPersons.length) }} 
              de {{ filteredPersons.length }} personas
            </div>
            
            <div class="flex items-center gap-2">
              <BaseButton
                label="Anterior"
                color="info"
                outline
                small
                :disabled="personsStore.pagination.currentPage === 1"
                @click="changePage(personsStore.pagination.currentPage - 1)"
              />
              
              <span class="text-sm text-gray-500">
                Página {{ personsStore.pagination.currentPage }} de {{ personsStore.totalPages }}
              </span>
              
              <BaseButton
                label="Siguiente"
                color="info"
                outline
                small
                :disabled="personsStore.pagination.currentPage === personsStore.totalPages"
                @click="changePage(personsStore.pagination.currentPage + 1)"
              />
            </div>
          </div>
        </div>
      </CardBox>

      <!-- ========================================
           MODAL DE CONFIRMACIÓN DE DESACTIVACIÓN
           ======================================== -->
      <div v-if="showDeactivateModal" class="fixed inset-0 z-50 overflow-y-auto bg-black/40">
        <div class="flex items-start justify-center min-h-screen pt-4 px-4 pb-20 text-left sm:block sm:p-0">
          <!-- Overlay -->
          <div class="fixed inset-0 transition-opacity" @click="closeDeactivateModal">
            <div class="absolute inset-0 bg-gray-500 opacity-50"></div>
          </div>
          
          <!-- Modal -->
          <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <CardBox isModal>
              <SectionTitleLineWithButton :icon="mdiDelete" title="Desactivar Persona" main />
              
              <div class="sm:flex sm:items-start">
                <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <span class="text-red-600">⚠️</span>
                </div>
                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <p class="text-sm text-gray-500">
                    ¿Estás seguro de que deseas desactivar a la persona 
                    <strong>{{ personToDeactivate?.nombres }} {{ personToDeactivate?.apellidos }}</strong>? 
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              
              <template #footer>
                <BaseButtons>
                  <BaseButton
                    label="Desactivar"
                    color="danger"
                    @click="confirmDeactivate"
                  />
                  <BaseButton
                    label="Cancelar"
                    color="info"
                    outline
                    @click="closeDeactivateModal"
                  />
                </BaseButtons>
              </template>
            </CardBox>
          </div>
        </div>
      </div>

      <!-- ========================================
           MODAL DE FORMULARIO (CREAR/EDITAR)
           ======================================== -->
      <div v-if="showFormModal" class="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
        <div class="flex items-center justify-center min-h-screen px-4 py-8 text-center">
          <!-- Overlay -->
          <div class="fixed inset-0 transition-opacity" @click="closeFormModal">
            <div class="absolute inset-0 bg-gray-800/70"></div>
          </div>
          
          <!-- Modal -->
          <div class="relative inline-block align-middle bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all w-full max-w-4xl">
            <CardBox isModal>
              <SectionTitleLineWithButton 
                :icon="isEditing ? mdiPencil : mdiPlus" 
                :title="isEditing ? 'Editar Persona' : 'Nueva Persona'" 
                main 
              />
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Nombres -->
                <FormField label="Nombres" help="Nombres de la persona">
                  <FormControl
                    v-model="personForm.nombres"
                    :icon="mdiAccount"
                    placeholder="Ingrese los nombres"
                  />
                </FormField>
                
                <!-- Apellidos -->
                <FormField label="Apellidos" help="Apellidos de la persona">
                  <FormControl
                    v-model="personForm.apellidos"
                    :icon="mdiAccount"
                    placeholder="Ingrese los apellidos"
                  />
                </FormField>
                
                <!-- Edad -->
                <FormField label="Edad" help="Edad de la persona">
                  <FormControl
                    v-model="personForm.edad"
                    type="number"
                    :icon="mdiCalendar"
                    placeholder="Ingrese la edad"
                  />
                </FormField>
                
                <!-- Casa/Apartamento ID -->
                <FormField label="Casa/Apartamento ID" help="ID de la casa o apartamento">
                  <FormControl
                    v-model="personForm.casa_apartamento_id"
                    type="number"
                    :icon="mdiHome"
                    placeholder="Ingrese el ID de la casa/apartamento"
                  />
                </FormField>
                
                <!-- Email -->
                <FormField label="Email" help="Correo electrónico (opcional)">
                  <FormControl
                    v-model="personForm.email"
                    type="email"
                    :icon="mdiEmail"
                    placeholder="Ingrese el email"
                  />
                </FormField>
                
                <!-- Celular -->
                <FormField label="Celular" help="Número de celular (opcional)">
                  <FormControl
                    v-model="personForm.celular"
                    :icon="mdiPhone"
                    placeholder="Ingrese el celular"
                  />
                </FormField>
                
                <!-- Usuario asociado -->
                <FormField label="Usuario asociado" help="Debe seleccionar un usuario para la persona">
                  <FormControl
                    v-model="personForm.usuario_id"
                    :options="selectUserOptions"
                    :icon="mdiAccountKey"
                    placeholder="Seleccione un usuario"
                  />
                </FormField>
                
                <!-- Checkboxes -->
                <div class="space-y-4">
                  <!-- Es Propietario -->
                  <FormField label="Es Propietario">
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        v-model="personForm.is_propietario"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span class="ml-2 text-sm text-gray-700">La persona es propietaria</span>
                    </div>
                  </FormField>
                  
                  <!-- Es Arrendatario -->
                  <FormField label="Es Arrendatario">
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        v-model="personForm.is_arrendatario"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span class="ml-2 text-sm text-gray-700">La persona es arrendataria</span>
                    </div>
                  </FormField>
                  
                  <!-- Acepta Términos -->
                  <FormField label="Acepta Términos y Condiciones">
                    <div class="flex items-center">
                      <input
                        type="checkbox"
                        v-model="personForm.acepta_terminosycondiciones"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span class="ml-2 text-sm text-gray-700">Acepta términos y condiciones</span>
                    </div>
                  </FormField>
                </div>
              </div>
              
              <template #footer>
                <BaseButtons>
                  <BaseButton
                    :label="isEditing ? 'Actualizar' : 'Crear'"
                    color="info"
                    @click="savePerson"
                  />
                  <BaseButton
                    label="Cancelar"
                    color="info"
                    outline
                    @click="closeFormModal"
                  />
                </BaseButtons>
              </template>
            </CardBox>
          </div>
        </div>
      </div>
    </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>
