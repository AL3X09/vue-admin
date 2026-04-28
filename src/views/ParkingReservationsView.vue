<script setup>

import { ref, computed, onMounted, watch } from 'vue'
import { 
  mdiCar, 
  mdiPlus, 
  mdiPencil, 
  mdiDelete, 
  mdiCheckCircle, 
  mdiAlertCircle,
  mdiMagnify,
  mdiFilter,
  mdiRefresh,
  mdiCarSports,
  mdiMotorbike,
  mdiBike,
  mdiParking,
  mdiLock,
  mdiLockOpen,
  mdiEye,
  mdiCancel,
  mdiCheck,
  mdiAccount,
  mdiCalendarClock,
  mdiCash
} from '@mdi/js'
import SectionMain from '@/components/SectionMain.vue'
import CardBox from '@/components/CardBox.vue'
import CardBoxModal from '@/components/CardBoxModal.vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import BaseButton from '@/components/BaseButton.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import NotificationBar from '@/components/NotificationBar.vue'
import CardBoxComponentEmpty from '@/components/CardBoxComponentEmpty.vue'
import { useParkingReservationsStore } from '@/stores/parkingReservations.store'
import { useAuthStore } from '@/stores/auth.store'
import { useCasaInteriorLinksStore } from '@/stores/casaInteriorLinks.store'
import { useVehicleTypesStore } from '@/stores/vehicleTypes.store'
import { mdiOfficeBuilding, mdiWarehouse, mdiHuman, mdiMail, mdiPhoneOutline, mdiFileDocumentOutline, mdiNumericOff } from '@mdi/js'

const parkingReservationsStore = useParkingReservationsStore()
const authStore = useAuthStore()
const torreInteriorLinksStore = useCasaInteriorLinksStore()
const vehicleTypesStore = useVehicleTypesStore()

const showDetailModal = ref(false)
const showCancelModal = ref(false)
const selectedReservation = ref(null)
const showCompleteModal = ref(false)
const showCreateModal = ref(false)

const selectTipoDocumento = [
  { id: 'CC', label: 'CC' },
  { id: 'TI', label: 'TI' },
  { id: 'NIT', label: 'NIT' },
]
const selectTipoVehiculo = computed(() => vehicleTypesStore.vehicleTypeOptions)

const createForm = ref({
  tipoDocumento: null,
  numeroDocumento: null,
  nombreVisitante: null,
  emailVisitante: null,
  celularVisitante: null,
  tipoVehiculo: null,
  placaVehiculo: null,
  fechaInicio: null,
  horaInicio: null,
  relacioninteriorcasaId: null,
})

const createLoading = ref(false)
const createError = ref(null)
const createSuccess = ref(null)

const searchQuery = ref('')
const selectedStatus = ref(null)
const showActiveOnly = ref(true)

const selectStatusOptions = [
  { id: null, label: 'Todos' },
  { id: 'ACTIVE', label: 'Activas' },
  { id: 'COMPLETED', label: 'Completadas' },
  { id: 'CANCELLED', label: 'Canceladas' },
]

const filteredReservations = computed(() => {
  let reservations = [...parkingReservationsStore.reservations]
  
  if (searchQuery.value) {
    const searchLower = searchQuery.value.toLowerCase()
    reservations = reservations.filter(res => 
      res.visitor_name?.toLowerCase().includes(searchLower) ||
      res.visitor_email?.toLowerCase().includes(searchLower) ||
      res.visitor_document_number?.toLowerCase().includes(searchLower) ||
      res.vehicle_code?.toLowerCase().includes(searchLower) ||
      res.visitor_cell?.toLowerCase().includes(searchLower)
    )
  }
  
  if (selectedStatus.value) {
    reservations = reservations.filter(res => res.status === selectedStatus.value)
  }
  
  return reservations
})

const paginatedReservations = computed(() => {
  const start = parkingReservationsStore.pagination.offset
  const end = start + parkingReservationsStore.pagination.limit
  return filteredReservations.value.slice(start, end)
})

const reservationStats = computed(() => {
  const reservations = parkingReservationsStore.reservations
  return {
    total: reservations.length,
    active: reservations.filter(r => r.status === 'ACTIVE').length,
    completed: reservations.filter(r => r.status === 'COMPLETED').length,
    cancelled: reservations.filter(r => r.status === 'CANCELLED').length,
  }
})

const roleName = computed(() => {
  return authStore.roleName
})


const searchTICA = ref('')

//select entre interior/torre y casa/apartamento
const selectOptionsTICA = computed(() => {

    return torreInteriorLinksStore.links.map((itca) => ({
    label: `T-${itca.torre_interior.t_numero_letra} - A-${itca.casa_apartamento.c_numero_letra}`,
    value: itca.id,
  }))
  
})

const filteredOptionsTICA = computed(() => {
  if (!searchTICA.value) return selectOptionsTICA.value
  const searchLower = searchTICA.value.toLowerCase()
  return selectOptionsTICA.value.filter(option => 
    option.label.toLowerCase().includes(searchLower)
  )
})

onMounted(async () => {
  console.log('eh esperado:', authStore.roleId)
  await parkingReservationsStore.fetchReservationsByRole({ role: roleName.value, user_id: authStore.userId })
  if (!torreInteriorLinksStore.loadedOnce) {
    await torreInteriorLinksStore.fetchLinks({ active_only: true, limit: 700, offset: 0 })
  }
  await vehicleTypesStore.fetchActiveVehicleTypes()
})

watch([searchQuery, selectedStatus, showActiveOnly], () => {
  parkingReservationsStore.setFilters({
    status: selectedStatus.value,
    active_only: showActiveOnly.value,
  })
})

const openCreateModal = () => {
  resetCreateForm()
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  resetCreateForm()
}

const resetCreateForm = () => {
  createForm.value = {
    tipoDocumento: null,
    numeroDocumento: null,
    nombreVisitante: null,
    emailVisitante: null,
    celularVisitante: null,
    tipoVehiculo: null,
    placaVehiculo: null,
    fechaInicio: null,
    horaInicio: null,
    relacioninteriorcasaId: null,
  }
  searchTICA.value = ''
  createError.value = null
  createSuccess.value = null
}

const submitCreate = async () => {
  if (!createForm.value.relacioninteriorcasaId) {
    alert('No existe relación válida entre la torre/interior y el apartamento seleccionado.')
    return
  }

  if (!createForm.value.tipoDocumento || !createForm.value.numeroDocumento || !createForm.value.nombreVisitante || 
      !createForm.value.emailVisitante || !createForm.value.celularVisitante || !createForm.value.fechaInicio || !createForm.value.horaInicio ||
      !createForm.value.tipoVehiculo || !createForm.value.placaVehiculo) {
    alert('Por favor, completa todos los campos requeridos.')
    return
  }

  createLoading.value = true
  createError.value = null
  createSuccess.value = null

  try {
    const billed_minutes = createForm.value.horaInicio
    
    const formatToBogotaISO = (date) => {
      const d = new Date(date)
      const bogotaOffset = -5 * 60
      const bogotaDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000 + bogotaOffset * 60000)
      const year = bogotaDate.getFullYear()
      const month = String(bogotaDate.getMonth() + 1).padStart(2, '0')
      const day = String(bogotaDate.getDate()).padStart(2, '0')
      const hours = String(bogotaDate.getHours()).padStart(2, '0')
      const minutes = String(bogotaDate.getMinutes()).padStart(2, '0')
      const seconds = String(bogotaDate.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    }
    
    const startDate = new Date(createForm.value.fechaInicio)
    const endDate = new Date(startDate.getTime() + billed_minutes * 60000)

    const payload = {
      spot_id: 0,
      casa_apto_interior_torre_id: createForm.value.relacioninteriorcasaId,
      starts_at: formatToBogotaISO(startDate),
      ends_at: formatToBogotaISO(endDate),
      visitor_type_document: createForm.value.tipoDocumento?.id || createForm.value.tipoDocumento,
      visitor_document_number: createForm.value.numeroDocumento,
      visitor_name: createForm.value.nombreVisitante,
      visitor_email: createForm.value.emailVisitante,
      visitor_cell: createForm.value.celularVisitante,
      vehicle_type_id: createForm.value.tipoVehiculo,
      vehicle_code: createForm.value.placaVehiculo,
      billed_minutes: createForm.value.horaInicio,
    }

    const result = await parkingReservationsStore.createReservation(payload)
    
    createSuccess.value = 'Reserva creada correctamente. ID: ' + result.id
    closeCreateModal()
    await parkingReservationsStore.fetchReservationsByRole({ role: roleName.value, user_id: authStore.userId })
  } catch (err) {
    console.error('Error al crear reserva:', err)
    const detail = err?.response?.data?.detail
    createError.value = typeof detail === 'string' ? detail : 'Error al crear la reserva'
  } finally {
    createLoading.value = false
  }
}

const openDetailModal = (reservation) => {
  selectedReservation.value = reservation
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedReservation.value = null
}

const openCancelModal = (reservation) => {
  selectedReservation.value = reservation
  showCancelModal.value = true
}

const closeCancelModal = () => {
  showCancelModal.value = false
  selectedReservation.value = null
}

const confirmCancel = async () => {
  try {
    await parkingReservationsStore.cancelReservation(selectedReservation.value.id)
    closeCancelModal()
    await parkingReservationsStore.fetchReservationsByRole({ role: roleName.value, user_id: authStore.userId })
  } catch (error) {
    console.error('Error al cancelar reserva:', error)
  }
}

const openCompleteModal = (reservation) => {
  selectedReservation.value = reservation
  showCompleteModal.value = true
}

const closeCompleteModal = () => {
  showCompleteModal.value = false
  selectedReservation.value = null
}

const confirmComplete = async () => {
  try {
    await parkingReservationsStore.completeReservation(selectedReservation.value.id)
    closeCompleteModal()
    await parkingReservationsStore.fetchReservationsByRole({ role: roleName.value, user_id: authStore.userId })
  } catch (error) {
    console.error('Error al completar reserva:', error)
  }
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = null
  showActiveOnly.value = true
}

const refreshReservations = async () => {
  await parkingReservationsStore.fetchReservationsByRole({ role: roleName.value, user_id: authStore.userId })
}

const getStatusColor = (status) => {
  const colors = {
    ACTIVE: 'success',
    COMPLETED: 'info',
    CANCELLED: 'danger',
  }
  return colors[status] || 'neutral'
}

const getStatusLabel = (status) => {
  const labels = {
    ACTIVE: 'Activa',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
  }
  return labels[status] || status
}

const getVehicleTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'carro': return mdiCarSports
    case 'moto': return mdiMotorbike
    case 'cicla': return mdiBike
    case 'cicla electrica': return mdiBike
    case 'patineta electrica': return mdiBike
    default: return mdiCar
  }
}

const getVehicleTypeLabel = (type) => {
  switch (type?.toLowerCase()) {
    case 'carro': return 'Carro'
    case 'moto': return 'Motocicleta'
    case 'cicla': return 'Bicicleta'
    case 'cicla electrica': return 'Bicicleta Eléctrica'
    case 'patineta electrica': return 'Patineta Eléctrica'
    default: return type || 'N/A'
  }
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
  }).format(value)
}
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :icon="mdiParking" title="Reservas Parqueadero Visitante" main>
        <BaseButton
          :icon="mdiPlus"
          label="Nueva Reserva"
          color="contrast"
          rounded-full
          small
          @click="openCreateModal"
        />
      </SectionTitleLineWithButton>

      <NotificationBar v-if="!isAdmin && isResident" color="info" :icon="mdiMagnify">
        <b>Vista de residente:</b> Solo puede ver las reservas asociadas a su unidad residencial.
        Utilice el filtro de búsqueda para encontrar reservas específicas.
      </NotificationBar>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">{{ reservationStats.total }}</div>
            <div class="text-sm text-gray-500">Total Reservas</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-600">{{ reservationStats.active }}</div>
            <div class="text-sm text-gray-500">Activas</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-600">{{ reservationStats.completed }}</div>
            <div class="text-sm text-gray-500">Completadas</div>
          </div>
        </CardBox>
        
        <CardBox class="p-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-red-600">{{ reservationStats.cancelled }}</div>
            <div class="text-sm text-gray-500">Canceladas</div>
          </div>
        </CardBox>
      </div>

      <CardBox class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField label="Buscar">
            <FormControl
              v-model="searchQuery"
              :icon="mdiMagnify"
              placeholder="Buscar por nombre, documento, placa, email..."
            />
          </FormField>
          
          <FormField label="Estado">
            <FormControl
              v-model="selectedStatus"
              :options="selectStatusOptions"
              :icon="mdiFilter"
            />
          </FormField>
          
          <div class="flex items-end gap-2">
            <BaseButton
              :icon="mdiRefresh"
              color="info"
              small
              @click="refreshReservations"
            />
            <BaseButton
              label="Limpiar"
              color="info"
              outline
              small
              @click="clearFilters"
            />
          </div>
        </div>
      </CardBox>

      <CardBox class="mb-6" has-table>
        <div v-if="parkingReservationsStore.loading" class="p-8 text-center">
          <div class="text-gray-500">Cargando reservas...</div>
        </div>
        
        <NotificationBar v-else-if="parkingReservationsStore.error" color="danger" :icon="mdiAlertCircle">
          {{ parkingReservationsStore.error }}
        </NotificationBar>
        
        <div v-else-if="paginatedReservations.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visitante
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehículo
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inicio - Fin
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="reservation in paginatedReservations" :key="reservation.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span :icon="mdiAccount" class="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ reservation.visitor_name }}
                      </div>
                      <div class="text-sm text-gray-500">
                        {{ reservation.visitor_type_document }}: {{ reservation.visitor_document_number }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <span :icon="getVehicleTypeIcon(reservation.vehicle_type)" class="w-5 h-5 text-gray-600" />
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {{ getVehicleTypeLabel(reservation.vehicle_type) }}
                      </div>
                      <div class="text-sm text-gray-500">
                        {{ reservation.vehicle_code }}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    <div class="flex items-center gap-1">
                      <span :icon="mdiCalendarClock" class="w-4 h-4 text-gray-500" />
                      {{ formatDateTime(reservation.starts_at) }}
                    </div>
                    <div class="text-xs text-gray-500">
                      a {{ formatDateTime(reservation.ends_at) }}
                    </div>
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getStatusColor(reservation.status)}-100 text-${getStatusColor(reservation.status)}-800`">
                    {{ getStatusLabel(reservation.status) }}
                  </span>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <span :icon="mdiCash" class="w-4 h-4 text-gray-500" />
                    {{ formatCurrency(reservation.total_price) }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ reservation.billed_minutes }} min
                  </div>
                </td>
                
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center gap-2">
                    <BaseButton
                      :icon="mdiEye"
                      color="info"
                      small
                      @click="openDetailModal(reservation)"
                      title="Ver detalles"
                    />
                    <BaseButton
                      v-if="reservation.status === 'ACTIVE'"
                      :icon="mdiCheck"
                      color="success"
                      small
                      @click="openCompleteModal(reservation)"
                      title="Completar"
                    />
                    <BaseButton
                      v-if="reservation.status === 'ACTIVE'"
                      :icon="mdiCancel"
                      color="danger"
                      small
                      @click="openCancelModal(reservation)"
                      title="Cancelar"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div class="px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-700">
                Mostrando {{ parkingReservationsStore.pagination.offset + 1 }} 
                a {{ Math.min(parkingReservationsStore.pagination.offset + parkingReservationsStore.pagination.limit, filteredReservations.length) }} 
                de {{ filteredReservations.length }} reservas
              </div>
              <div class="flex gap-2">
                <BaseButton
                  label="Anterior"
                  color="info"
                  outline
                  small
                  :disabled="parkingReservationsStore.pagination.offset === 0"
                  @click="parkingReservationsStore.setPagination({ offset: parkingReservationsStore.pagination.offset - parkingReservationsStore.pagination.limit })"
                />
                <BaseButton
                  label="Siguiente"
                  color="info"
                  outline
                  small
                  :disabled="parkingReservationsStore.pagination.offset + parkingReservationsStore.pagination.limit >= filteredReservations.length"
                  @click="parkingReservationsStore.setPagination({ offset: parkingReservationsStore.pagination.offset + parkingReservationsStore.pagination.limit })"
                />
              </div>
            </div>
          </div>
        </div>
        
        <CardBoxComponentEmpty v-else />
      </CardBox>

      <CardBoxModal
        v-model="showDetailModal"
        :title="`Detalle Reserva #${selectedReservation?.id || ''}`"
        :hasCancel="true"
        @cancel="closeDetailModal"
      >
        <div v-if="selectedReservation">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Nombre del Visitante</p>
              <p class="font-bold">{{ selectedReservation.visitor_name }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Documento del Visitante</p>
              <p class="font-bold">{{ selectedReservation.visitor_type_document }}: {{ selectedReservation.visitor_document_number }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Email del Visitante</p>
              <p class="font-bold">{{ selectedReservation.visitor_email }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Celular del Visitante</p>
              <p class="font-bold">{{ selectedReservation.visitor_cell }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Tipo de Vehículo</p>
              <p class="font-bold">{{ getVehicleTypeLabel(selectedReservation.vehicle_type) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Placa/Identificador</p>
              <p class="font-bold">{{ selectedReservation.vehicle_code }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Fecha Inicio</p>
              <p class="font-bold">{{ formatDateTime(selectedReservation.starts_at) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Fecha Fin</p>
              <p class="font-bold">{{ formatDateTime(selectedReservation.ends_at) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Minutos Facturados</p>
              <p class="font-bold">{{ selectedReservation.billed_minutes }} minutos</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Valor Total</p>
              <p class="font-bold text-lg text-green-600">{{ formatCurrency(selectedReservation.total_price) }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-sm text-gray-500">Estado</p>
              <span :class="`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getStatusColor(selectedReservation.status)}-100 text-${getStatusColor(selectedReservation.status)}-800`">
                {{ getStatusLabel(selectedReservation.status) }}
              </span>
            </div>
            <div v-if="selectedReservation.qr_token" class="col-span-2">
              <p class="text-sm text-gray-500">QR Token</p>
              <p class="font-mono text-xs bg-gray-100 p-2 rounded">{{ selectedReservation.qr_token }}</p>
            </div>
          </div>
        </div>
      </CardBoxModal>

      <CardBoxModal
        v-model="showCancelModal"
        title="Cancelar Reserva"
        button="danger"
        buttonLabel="Cancelar"
        :hasCancel="true"
        :isProcessing="parkingReservationsStore.loading"
        @confirm="confirmCancel"
        @cancel="closeCancelModal"
      >
        <div class="py-2">
          <p class="text-sm text-gray-500">
            ¿Estás seguro de que deseas cancelar la reserva de
            <strong>{{ selectedReservation?.visitor_name }}</strong>?
            Esta acción no se puede deshacer.
          </p>
        </div>
      </CardBoxModal>

      <CardBoxModal
        v-model="showCompleteModal"
        title="Completar Reserva"
        button="success"
        buttonLabel="Completar"
        :hasCancel="true"
        :isProcessing="parkingReservationsStore.loading"
        @confirm="confirmComplete"
        @cancel="closeCompleteModal"
      >
        <div class="py-2">
          <p class="text-sm text-gray-500">
            ¿Confirmas que la reserva de
            <strong>{{ selectedReservation?.visitor_name }}</strong>
            se ha completado (el visitante hizo uso del parqueadero)?
          </p>
        </div>
      </CardBoxModal>

      <CardBoxModal
        v-model="showCreateModal"
        title="Nueva Reserva Parqueadero Visitante"
        button="info"
        buttonLabel="Crear"
        :hasCancel="true"
        :isForm="true"
        :isProcessing="createLoading"
        @confirm="submitCreate"
        @cancel="closeCreateModal"
      >
        <div class="space-y-4">
          
          <FormField label="Buscar Torre/Interior">
            <FormControl v-model="searchTICA" :icon="mdiMagnify" placeholder="Buscar por T- o A-..." />
          </FormField>

          <FormField label="Torre o Interior">
            <FormControl v-model="createForm.relacioninteriorcasaId" :options="filteredOptionsTICA" :icon="mdiOfficeBuilding" required />
          </FormField>

          <!--
          <FormField label="Apartamento">
            <FormControl v-model="createForm.apartamento" :options="selectOptionsCA" :icon="mdiWarehouse" required />
          </FormField>

          <div v-if="createForm.torre && createForm.apartamento" class="mt-2 text-sm">
            <span v-if="relacionStore.loading">Buscando relación…</span>
            <span v-else-if="relacionStore.error" class="text-red-600">{{ relacionStore.error }}</span>
            <span v-else-if="createForm.relacioninteriorcasaId" class="text-green-700">Relación encontrada (ID: {{ createForm.relacioninteriorcasaId }})</span>
            <span v-else class="text-yellow-700">Sin relación encontrada.</span>
          </div>-->

          <FormField label="Tipo de Documento">
            <FormControl v-model="createForm.tipoDocumento" :options="selectTipoDocumento" :icon="mdiFileDocumentOutline" required />
          </FormField>

          <FormField label="Número de Documento" help="Solo valores numéricos">
            <FormControl v-model="createForm.numeroDocumento" type="text" @input="createForm.numeroDocumento = createForm.numeroDocumento?.replace(/[^0-9]/g, '')" required />
          </FormField>

          <FormField label="Nombre Completo Visitante">
            <FormControl v-model="createForm.nombreVisitante" type="text" :icon="mdiHuman" required />
          </FormField>

          <FormField label="Correo Visitante">
            <FormControl v-model="createForm.emailVisitante" type="email" :icon="mdiMail" required />
          </FormField>

          <FormField label="Celular Visitante">
            <FormControl v-model="createForm.celularVisitante" type="tel" :icon="mdiPhoneOutline" @input="createForm.celularVisitante = createForm.celularVisitante?.replace(/[^0-9]/g, '')" required />
          </FormField>

          <FormField label="Tipo de Vehículo">
            <FormControl v-model="createForm.tipoVehiculo" :options="selectTipoVehiculo" required />
          </FormField>

          <FormField label="Placa o Identificador">
            <FormControl v-model="createForm.placaVehiculo" :icon="mdiNumericOff" type="text" required />
          </FormField>

          <FormField label="Fecha y Hora de Inicio">
            <FormControl v-model="createForm.fechaInicio" type="datetime-local" />
          </FormField>

          <FormField label="Minutos a Solicitar">
            <FormControl v-model="createForm.horaInicio" type="number" placeholder="Ej: 60" required />
          </FormField>

          <div v-if="createError" class="text-red-600 text-sm">{{ createError }}</div>
          <div v-if="createSuccess" class="text-green-600 text-sm">{{ createSuccess }}</div>
        </div>
      </CardBoxModal>

    </SectionMain>
  </LayoutAuthenticated>
</template>