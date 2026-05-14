<script setup>
/**
 * VISTA UNIFICADA DE GESTIÓN DE PERSONAS Y USUARIOS
 * 
 * Esta vista permite gestionar personas y opcionalmente crear/asignar
 * usuarios a las personas. Incluye funcionalidades de:
 * - Listar personas con filtros y paginación
 * - Crear nuevas personas
 * - Opcionalmente crear o asignar un usuario a la persona
 * - Editar personas existentes
 * - Desactivar personas
 * - Filtrar por propietario/arrendatario
 * - Filtrar por estado activo
 * - Búsqueda por nombre, email o celular
 * - Selección de torre/interior y casa/apartamento (desde backend)
 * 
 * FLUJO DE CREACIÓN:
 * 1. Se crea la persona con sus datos básicos
 * 2. Se selecciona la torre/interior y casa/apartamento
 * 3. Se pregunta: "¿Desea crearle o asignarle un usuario a esta persona?"
 * 4. Si la respuesta es SÍ:
 *    - Opción A: Crear un nuevo usuario (formulario inline)
 *    - Opción B: Asignar un usuario existente (select)
 * 5. Si la respuesta es NO: Se crea la persona sin usuario asociado
 * 
 * PROPIEDADES (Torres/Interiores y Casas/Apartamentos):
 * - Los datos se cargan desde el backend mediante el store de propiedades
 * - Torres/Interiores: Representan las torres o interiores del conjunto
 * - Casas/Apartamentos: Representan las casas o apartamentos disponibles
 * - El campo casa_apartamento_id se asigna automáticamente al seleccionar
 * 
 * NOTA: Esta vista es solo para administradores. Requiere permisos:
 * - person:read - Para listar y ver personas
 * - person:write - Para crear, actualizar y desactivar personas
 * - user:read - Para listar usuarios
 * - user:write - Para crear usuarios
 * - tower_interior:read - Para listar torres/interiores
 * - house_apartment:read - Para listar casas/apartamentos
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
  mdiCalendar,
  mdiHome,
  mdiAccountStar,
  mdiAccountKey,
  mdiCheckCircle,
  mdiAlertCircle,
  mdiAccountArrowRight,
  mdiAccountPlus,
  mdiLinkVariant,
  mdiEmail,
  mdiPhone
} from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import CardBoxModal from '@/components/CardBoxModal.vue'
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
import { usePropertiesStore } from '@/stores/properties.store'
import { useRolesStore } from '@/stores/roles.store'
import { useCasaInteriorLinksStore } from '@/stores/casaInteriorLinks.store'

// ============================================
// STORES
// ============================================
const personsStore = usePersonsStore()
const usersStore = useUsersStore()
const propertiesStore = usePropertiesStore()
const rolesStore = useRolesStore()
const linksStore = useCasaInteriorLinksStore()

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
  casa_interior_link_id: null,
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

// Opción de crear/asignar usuario
const createUserOption = ref(false) // Si desea crear/asignar usuario
const userCreationMode = ref('new') // 'new' o 'existing'

// Formulario de usuario (para creación inline)
const userForm = ref({
  username: '',
  password: '',
  role_id: '',
})

// Filtros
const searchQuery = ref('')
const selectedPropietario = ref(null)
const selectedArrendatario = ref(null)
const showActiveOnly = ref(true)

// Selección de propiedad (torre/interior y apartamento)
const selectedTorreInterior = ref(null)
const selectedCasaApartamento = ref(null)

// Validación de errores
const validationErrors = ref({})

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
    label: `${user.username}`,
  }))
})

// Opciones de roles para el select
const selectRoleOptions = computed(() => {
  return rolesStore.roles.map(role => ({
    id: role.id,
    label: role.name,
  }))
})

// Opciones de torres/interiores para el select
const selectTorreInteriorOptions = computed(() => {
  return propertiesStore.torresInterioresOptions
})

// Opciones de casas/apartamentos para el select
const selectCasaApartamentoOptions = computed(() => {
  return propertiesStore.casasApartamentosOptions
})

// Opciones de vínculos casa-interior para el select
const selectCasaInteriorLinkOptions = computed(() => {
  return linksStore.linksList
    .filter(link => link.is_active)
    .map(link => ({
      id: link.id,
      label: `Torre ${link.torre_interior_id} - Casa/Apto ${link.casa_apartamento_id}`,
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
  // Cargar personas, usuarios, propiedades, roles y vínculos al montar el componente
  await Promise.all([
    personsStore.fetchPersons(),
    usersStore.fetchUsers(),
    propertiesStore.fetchAllProperties(),
    rolesStore.fetchRoles(),
    linksStore.fetchLinks({ active_only: true }),
  ])
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

// Sincronizar el ID seleccionado de vínculo con el formulario
watch(selectedCasaApartamento, (newValue) => {
  if (newValue) {
    // Buscar el vínculo que corresponde a la torre y casa seleccionadas
    const link = linksStore.linksList.find(l => 
      l.torre_interior_id === selectedTorreInterior.value && 
      l.casa_apartamento_id === newValue
    )
    personForm.value.casa_interior_link_id = link ? link.id : null
  } else {
    personForm.value.casa_interior_link_id = null
  }
})

// Limpiar errores de validación cuando cambian los campos del formulario
watch([personForm, selectedTorreInterior, selectedCasaApartamento], () => {
  if (Object.keys(validationErrors.value).length > 0) {
    validationErrors.value = {}
  }
  // Actualizar el vínculo cuando cambia la torre
  if (selectedTorreInterior.value && selectedCasaApartamento.value) {
    const link = linksStore.linksList.find(l => 
      l.torre_interior_id === selectedTorreInterior.value && 
      l.casa_apartamento_id === selectedCasaApartamento.value
    )
    personForm.value.casa_interior_link_id = link ? link.id : null
  }
}, { deep: true })

// Asegurar que solo un tipo de persona pueda ser seleccionado
watch(() => personForm.value.is_propietario, (newValue) => {
  if (newValue === true) {
    personForm.value.is_arrendatario = false
  }
})

watch(() => personForm.value.is_arrendatario, (newValue) => {
  if (newValue === true) {
    personForm.value.is_propietario = false
  }
})

// Sincronizar datos de persona con usuario cuando se crea nuevo usuario
watch([() => personForm.value.nombres, () => personForm.value.apellidos], () => {
  if (createUserOption.value && userCreationMode.value === 'new') {
    // Generar username sugerido basado en nombres
    if (personForm.value.nombres && personForm.value.apellidos) {
      const firstName = personForm.value.nombres.split(' ')[0].toLowerCase()
      const lastName = personForm.value.apellidos.split(' ')[0].toLowerCase()
      userForm.value.username = `${firstName}.${lastName}`
    }
  }
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
  
  validationErrors.value = {}
  
  // Llenar el formulario con los datos de la persona
  personForm.value = {
    casa_interior_link_id: person.casa_interior_link_id,
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
  
  // Si la persona ya tiene usuario, mostrar opción de asignar
  createUserOption.value = person.usuario_id !== null
  if (person.usuario_id) {
    userCreationMode.value = 'existing'
  }

  // Cargar torre/interior y casa/apartamento basada en el vínculo
  if (person.casa_interior_link_id) {
    const link = linksStore.linksList.find(l => l.id === person.casa_interior_link_id)
    if (link) {
      selectedTorreInterior.value = link.torre_interior_id
      selectedCasaApartamento.value = link.casa_apartamento_id
    }
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
    casa_interior_link_id: null,
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
  
  createUserOption.value = false
  userCreationMode.value = 'new'
  
  userForm.value = {
    username: '',
    password: '',
    role_id: null,
  }
  
  // Resetear selección de propiedad
  selectedTorreInterior.value = null
  selectedCasaApartamento.value = null
  
  validationErrors.value = {}
}

/**
 * Valida el formulario de persona
 * @returns {boolean} - true si es válido, false si no
 */
const validatePersonForm = () => {
  const errors = {}
  
  if (!personForm.value.nombres || personForm.value.nombres.trim() === '') {
    errors.nombres = 'El nombre es obligatorio'
  }
  
  if (!personForm.value.apellidos || personForm.value.apellidos.trim() === '') {
    errors.apellidos = 'El apellido es obligatorio'
  }
  
  if (!personForm.value.edad) {
    errors.edad = 'La edad es obligatoria'
  } else if (isNaN(personForm.value.edad) || personForm.value.edad < 1 || personForm.value.edad > 150) {
    errors.edad = 'La edad debe ser un número válido entre 1 y 150'
  }
  
  if (!selectedTorreInterior.value) {
    errors.torreInterior = 'La torre/interior es obligatoria'
  }
  
  if (!selectedCasaApartamento.value) {
    errors.casaApartamento = 'La casa/apartamento es obligatoria'
  }
  
  if (!personForm.value.casa_interior_link_id) {
    errors.casaApartamento = 'No existe un vínculo para esta combinación de torre y casa/apartamento'
  }
  
  if (!personForm.value.email || personForm.value.email.trim() === '') {
    errors.email = 'El email es obligatorio'
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(personForm.value.email)) {
      errors.email = 'El email debe tener un formato válido'
    }
  }
  
  if (!personForm.value.celular || personForm.value.celular.trim() === '') {
    errors.celular = 'El celular es obligatorio'
  } else {
    const celularRegex = /^\d+$/
    if (!celularRegex.test(personForm.value.celular)) {
      errors.celular = 'El celular debe contener solo números'
    } else if (personForm.value.celular.length < 10) {
      errors.celular = 'El celular debe tener al menos 10 dígitos'
    }
  }
  
  if (!personForm.value.is_propietario && !personForm.value.is_arrendatario) {
    errors.tipoPersona = 'Debe seleccionar si es propietario o arrendatario'
  }
  
  if (!personForm.value.acepta_terminosycondiciones) {
    errors.aceptaTerminos = 'Debe aceptar los términos y condiciones'
  }
  
  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

/**
 * Guarda la persona (crea o actualiza)
 * 
 * FLUJO DE NEGOCIO GARANTIZADO:
 * 
 * CASO 1: Sin usuario (createUserOption = false)
 *   -> Se crea la persona con usuario_id = null
 * 
 * CASO 2: Crear nuevo usuario (createUserOption = true && userCreationMode = 'new')
 *   1. Se crea el USUARIO primero
 *   2. Se crea la PERSONA con el usuario_id del usuario creado
 * 
 * CASO 3: Asignar usuario existente (createUserOption = true && userCreationMode = 'existing')
 *   1. Se crea la PERSONA primero
 *   2. Se actualiza la persona con el usuario_id seleccionado (si es edición)
 *   // NOTA: Para creación nueva, se pasa el usuario_id directamente en el payload
 * 
 * IMPORTANTE: La persona SIEMPRE se debe crear/actualizar, sin excepción
 */
const savePerson = async () => {
  // Validar formulario antes de proceder
  if (!validatePersonForm()) {
    return
  }
  
  try {
    console.log('🔵 INICIO savePerson - createUserOption:', createUserOption.value, 'userCreationMode:', userCreationMode.value)
    console.log('🔵 personForm:', JSON.stringify(personForm.value))
    console.log('🔵 isEditing:', isEditing.value)
    
    let usuarioId = null
    
    // ============================================================
    // CASO 2: Crear nuevo usuario + Nueva persona
    // (Primero usuario, luego persona)
    // ============================================================
    if (createUserOption.value && userCreationMode.value === 'new' && !isEditing.value) {
      console.log('🔵 CASO 2: Crear nuevo usuario -> luego persona')
      
      // Validar que el username y password estén completos
      if (!userForm.value.username || !userForm.value.password) {
        personsStore.error = 'Para crear un usuario, debe completar nombre de usuario y contraseña.'
        personsStore.successMessage = null
        console.log('🔴 Error: username o password vacíos')
        return
      }
      
      // Validar que se haya seleccionado un rol (obligatorio para crear usuario)
      if (!userForm.value.role_id) {
        personsStore.error = 'Debe seleccionar un rol para el usuario.'
        personsStore.successMessage = null
        console.log('🔴 Error: role_id vacío')
        return
      }
      
      console.log('🔵 Creando usuario con role_id:', userForm.value.role_id, 'username:', userForm.value.username)
      
      // Crear el usuario PRIMERO
      const newUser = await usersStore.createUser({
        username: userForm.value.username,
        password: userForm.value.password,
        role_id: Number(userForm.value.role_id),
      })
      
      // Obtener el ID del usuario creado para asociarlo a la persona
      usuarioId = newUser.id
      personForm.value.usuario_id = newUser.id
      console.log('✅ Usuario creado con ID:', usuarioId)
    }
    
    // ============================================================
    // CASO 2b: Crear nuevo usuario + Editar persona
    // (Primero usuario, luego persona actualizada)
    // ============================================================
    if (createUserOption.value && userCreationMode.value === 'new' && isEditing.value) {
      console.log('🔵 CASO 2b: Crear nuevo usuario -> luego editar persona')
      
      // Validar que el username y password estén completos
      if (!userForm.value.username || !userForm.value.password) {
        personsStore.error = 'Para crear un usuario, debe completar nombre de usuario y contraseña.'
        personsStore.successMessage = null
        console.log('🔴 Error: username o password vacíos')
        return
      }
      
      // Validar que se haya seleccionado un rol (obligatorio para crear usuario)
      if (!userForm.value.role_id) {
        personsStore.error = 'Debe seleccionar un rol para el usuario.'
        personsStore.successMessage = null
        console.log('🔴 Error: role_id vacío')
        return
      }
      
      console.log('🔵 Creando usuario con role_id:', userForm.value.role_id, 'username:', userForm.value.username)
      
      // Crear el usuario PRIMERO
      const newUser = await usersStore.createUser({
        username: userForm.value.username,
        password: userForm.value.password,
        role_id: Number(userForm.value.role_id),
      })
      
      // Obtener el ID del usuario creado para asociarlo a la persona
      usuarioId = newUser.id
      personForm.value.usuario_id = newUser.id
      console.log('✅ Usuario creado con ID:', usuarioId)
    }
    
    // ============================================================
    // CASO 3: Asignar usuario existente a nueva persona
    // (El usuario_id se pasa directamente en el payload)
    // ============================================================
    if (createUserOption.value && userCreationMode.value === 'existing' && !isEditing.value) {
      console.log('🔵 CASO 3: Asignar usuario existente -> crear persona')
      
      // Validar que se haya seleccionado un usuario
      if (!personForm.value.usuario_id) {
        personsStore.error = 'Debe seleccionar un usuario existente para asignar.'
        personsStore.successMessage = null
        return
      }
      
      // Usar el usuario_id seleccionado
      usuarioId = personForm.value.usuario_id
      console.log('🔵 Asignando usuario existente con ID:', usuarioId)
    }
    
    // ============================================================
    // CASO 3b: Asignar usuario existente a persona existente (edición)
    // ============================================================
    if (createUserOption.value && userCreationMode.value === 'existing' && isEditing.value) {
      console.log('🔵 CASO 3b: Asignar usuario existente -> editar persona')
      
      // Validar que se haya seleccionado un usuario
      if (!personForm.value.usuario_id) {
        personsStore.error = 'Debe seleccionar un usuario existente para asignar.'
        personsStore.successMessage = null
        return
      }
      
      // Usar el usuario_id seleccionado
      usuarioId = personForm.value.usuario_id
      console.log('🔵 Asignando usuario existente con ID:', usuarioId)
    }
    
    // ============================================================
    // CASO 1: Sin usuario (createUserOption = false)
    // usuarioId queda null, se crea persona sin usuario
    // ============================================================
    if (!createUserOption.value) {
      console.log('🔵 CASO 1: Sin usuario asociado')
      usuarioId = null
    }
    
    // ============================================================
    // PREPARAR PAYLOAD - siempre ejecutar
    // ============================================================
    const payload = {
      nombres: personForm.value.nombres,
      apellidos: personForm.value.apellidos,
      casa_interior_link_id: personForm.value.casa_interior_link_id ? Number(personForm.value.casa_interior_link_id) : null,
      edad: personForm.value.edad ? Number(personForm.value.edad) : null,
      celular: personForm.value.celular || null,
      email: personForm.value.email || null,
      is_propietario: personForm.value.is_propietario,
      is_arrendatario: personForm.value.is_arrendatario,
      acepta_terminosycondiciones: personForm.value.acepta_terminosycondiciones,
      usuario_id: usuarioId,
    }
    
    console.log('🔵 Payload de persona:', JSON.stringify(payload))
    
    // ============================================================
    // EJECUTAR: Crear o Actualizar persona (SIEMPRE obligatorio)
    // ============================================================
    if (isEditing.value) {
      // Actualizar persona existente
      console.log('🔵 Actualizando persona existente ID:', editingPersonId.value)
      await personsStore.updatePerson(editingPersonId.value, payload)
    } else {
      // Crear nueva persona - SIEMPRE se ejecuta
      console.log('🔵 Creando nueva persona...')
      await personsStore.createPerson(payload)
    }
    
    // Recargar lista de personas
    await personsStore.fetchPersons()
    
    // Recargar usuarios si se creó un nuevo usuario (Caso 2 o 2b)
    if (createUserOption.value && userCreationMode.value === 'new') {
      await usersStore.fetchUsers()
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
      <SectionTitleLineWithButton :icon="mdiAccountGroup" title="Gestión de Personas y Usuarios" main>
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
        
        <template v-else>
        <!-- Mensaje de error -->
        <NotificationBar v-if="personsStore.error" color="danger" :icon="mdiAlertCircle">
          {{ personsStore.error }}
        </NotificationBar>
        
        <!-- Mensaje de éxito -->
        <NotificationBar v-if="personsStore.successMessage" color="success" :icon="mdiCheckCircle">
          {{ personsStore.successMessage }}
        </NotificationBar>
        
        <!-- Tabla de personas -->
        <div v-if="paginatedPersons.length > 0" class="overflow-x-auto">
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
                  Tipo
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario Asociado
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
                        {{ person.edad ? `${person.edad} años` : 'Edad no especificada' }}
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
                
                <!-- Tipo -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="person.tipoPersonaClass" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ person.is_propietario ? 'Propietario' : person.is_arrendatario ? 'Arrendatario' : 'N/A' }}
                  </span>
                </td>
                
                <!-- Usuario Asociado -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="person.usuario_id" class="flex items-center gap-1">
                    <span :icon="mdiAccountKey" class="w-4 h-4 text-emerald-500" />
                    <span class="text-sm text-emerald-600" v-if="selectUserOptions">
                      {{ selectUserOptions.find(u => u.id === person.usuario_id)?.label || 'Usuario #' + person.usuario_id }}
                    </span>
                  </div>
                  <div v-else class="flex items-center gap-1">
                    <span class="text-sm text-gray-400">Sin usuario</span>
                  </div>
                </td>
                
                <!-- Estado -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="person.statusClass" class="text-sm font-medium">
                    {{ person.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                
                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center gap-2">
                    <BaseButton
                      :icon="mdiPencil"
                      color="info"
                      small
                      @click="openEditModal(person)"
                      title="Editar persona"
                    />
                    <BaseButton
                      v-if="person.is_active"
                      :icon="mdiAccountOff"
                      color="warning"
                      small
                      @click="openDeactivateModal(person)"
                      title="Desactivar persona"
                    />
                    <BaseButton
                      v-else
                      :icon="mdiAccountCheck"
                      color="success"
                      small
                      @click="togglePersonStatus(person)"
                      title="Activar persona"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- Paginación -->
          <div class="px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-700">
                Mostrando {{ (personsStore.pagination.currentPage - 1) * personsStore.pagination.pageSize + 1 }} 
                a {{ Math.min(personsStore.pagination.currentPage * personsStore.pagination.pageSize, filteredPersons.length) }} 
                de {{ filteredPersons.length }} personas
              </div>
              <div class="flex gap-2">
                <BaseButton
                  label="Anterior"
                  color="info"
                  outline
                  small
                  :disabled="personsStore.pagination.currentPage === 1"
                  @click="changePage(personsStore.pagination.currentPage - 1)"
                />
                <BaseButton
                  label="Siguiente"
                  color="info"
                  outline
                  small
                  :disabled="personsStore.pagination.currentPage >= personsStore.totalPages"
                  @click="changePage(personsStore.pagination.currentPage + 1)"
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Mensaje de lista vacía -->
        <CardBoxComponentEmpty v-else />
        </template>
      </CardBox>

      <!-- ========================================
           MODAL DE FORMULARIO DE PERSONA (estilo unificado)
           ======================================== -->
      <CardBoxModal
        v-model="showFormModal"
        :title="isEditing ? 'Editar Persona' : 'Nueva Persona'"
        :buttonLabel="isEditing ? 'Actualizar' : 'Crear'"
        :isForm="true"
        :isProcessing="personsStore.isLoading"
        :hasCancel="true"
        @confirm="savePerson"
        @cancel="closeFormModal"
      >
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Nombres -->
            <FormField label="Nombres *" help="Nombres de la persona" :error="validationErrors.nombres">
              <FormControl v-model="personForm.nombres" :icon="mdiAccount" placeholder="Ej: Juan Carlos" />
            </FormField>

            <!-- Apellidos -->
            <FormField label="Apellidos *" help="Apellidos de la persona" :error="validationErrors.apellidos">
              <FormControl v-model="personForm.apellidos" :icon="mdiAccount" placeholder="Ej: Pérez García" />
            </FormField>

            <!-- Edad -->
            <FormField label="Edad *" help="Edad de la persona" :error="validationErrors.edad">
              <FormControl v-model="personForm.edad" type="number" :icon="mdiCalendar" placeholder="Ej: 30" />
            </FormField>

            <!-- Torre/Interior -->
            <FormField label="Torre/Interior *" help="Seleccione la torre o interior" :error="validationErrors.torreInterior">
              <FormControl
                v-model="selectedTorreInterior"
                :options="selectTorreInteriorOptions"
                :icon="mdiHome"
                placeholder="Seleccione torre/interior"
              />
            </FormField>
            
            <!-- Casa/Apartamento -->
            <FormField label="Casa/Apartamento *" help="Seleccione la casa o apartamento" :error="validationErrors.casaApartamento">
              <FormControl
                v-model="selectedCasaApartamento"
                :options="selectCasaApartamentoOptions"
                :icon="mdiHome"
                placeholder="Seleccione casa/apartamento"
              />
            </FormField>

            <!-- Email -->
            <FormField label="Email *" help="Correo electrónico" :error="validationErrors.email">
              <FormControl v-model="personForm.email" type="email" :icon="mdiEmail" placeholder="Ej: juan@email.com" />
            </FormField>

            <!-- Celular -->
            <FormField label="Celular *" help="Número de celular" :error="validationErrors.celular">
              <FormControl 
                v-model="personForm.celular" 
                type="tel" 
                :icon="mdiPhone" 
                placeholder="Ej: 3001234567"
                @input="personForm.celular = personForm.celular?.replace(/[^0-9]/g, '')"
              />
            </FormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Tipo de Persona *" :error="validationErrors.tipoPersona">
              <div class="space-y-2">
                <div class="flex items-center">
                  <input type="radio" v-model="personForm.is_propietario" :value="true" id="is_propietario" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" @change="personForm.is_arrendatario = false" />
                  <label for="is_propietario" class="ml-2 text-sm text-gray-700">Es Propietario</label>
                </div>
                <div class="flex items-center">
                  <input type="radio" v-model="personForm.is_arrendatario" :value="true" id="is_arrendatario" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" @change="personForm.is_propietario = false" />
                  <label for="is_arrendatario" class="ml-2 text-sm text-gray-700">Es Arrendatario</label>
                </div>
              </div>
            </FormField>

            <FormField label="Términos y Condiciones *" :error="validationErrors.aceptaTerminos">
              <div class="flex items-center">
                <input type="checkbox" v-model="personForm.acepta_terminosycondiciones" id="acepta_terminos" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label for="acepta_terminos" class="ml-2 text-sm text-gray-700">Acepta términos y condiciones</label>
              </div>
            </FormField>
          </div>

          <BaseDivider />

          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex items-center mb-4">
              <input type="checkbox" v-model="createUserOption" id="createUserOption" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label for="createUserOption" class="ml-2 text-sm font-medium text-gray-700">¿Desea crearle o asignarle un usuario a esta persona?</label>
            </div>

            <div v-if="createUserOption" class="space-y-4">
              <div class="flex gap-4">
                <div class="flex items-center">
                  <input type="radio" v-model="userCreationMode" value="new" id="mode_new" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                  <label for="mode_new" class="ml-2 text-sm text-gray-700">Crear nuevo usuario</label>
                </div>
                <div class="flex items-center">
                  <input type="radio" v-model="userCreationMode" value="existing" id="mode_existing" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                  <label for="mode_existing" class="ml-2 text-sm text-gray-700">Asignar usuario existente</label>
                </div>
              </div>

              <div v-if="userCreationMode === 'new'" class="space-y-4 bg-white p-4 rounded border">
                <h4 class="text-sm font-medium text-gray-900 flex items-center gap-2"><span :icon="mdiAccountPlus" class="w-4 h-4" /> Datos del Nuevo Usuario</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Nombre de Usuario" help="Identificador único para iniciar sesión">
                    <FormControl v-model="userForm.username" :icon="mdiAccount" placeholder="Ej: juan.perez" />
                  </FormField>
                  <FormField label="Contraseña" help="Contraseña para iniciar sesión (minimo 8 caracteres)">
                    <FormControl v-model="userForm.password" type="password" :icon="mdiAccountKey" placeholder="Minimo 8 caracteres" />
                  </FormField>
                  <FormField label="Rol" help="Rol del usuario en el sistema">
                    <FormControl v-model="userForm.role_id" :options="selectRoleOptions" :icon="mdiAccountStar" />
                  </FormField>
                </div>
              </div>

              <div v-else-if="userCreationMode === 'existing'" class="bg-white p-4 rounded border">
                <h4 class="text-sm font-medium text-gray-900 flex items-center gap-2 mb-4"><span :icon="mdiLinkVariant" class="w-4 h-4" /> Seleccionar Usuario Existente</h4>
                <FormField label="Usuario" help="Selecciona un usuario existente para asociar a esta persona">
                  <FormControl v-model="personForm.usuario_id" :options="selectUserOptions" :icon="mdiAccount" />
                </FormField>
              </div>
            </div>
          </div>
        </div>
      </CardBoxModal>

      <!-- ========================================
           MODAL DE CONFIRMACIÓN DE DESACTIVACIÓN (estilo unificado)
           ======================================== -->
      <CardBoxModal
        v-model="showDeactivateModal"
        title="Desactivar Persona"
        button="danger"
        buttonLabel="Desactivar"
        :hasCancel="true"
        :isProcessing="personsStore.isLoading"
        @confirm="confirmDeactivate"
        @cancel="closeDeactivateModal"
      >
        <div class="py-2">
          <p class="text-sm text-gray-500">
            ¿Estás seguro de que deseas desactivar a
            <strong> {{ personToDeactivate?.nombres }} {{ personToDeactivate?.apellidos }}</strong>?
            Esta acción no se puede deshacer.
          </p>
        </div>
      </CardBoxModal>
      </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>
