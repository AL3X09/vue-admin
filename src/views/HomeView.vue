<script setup>
import { computed, ref, onMounted } from 'vue'
import { useMainStore } from '@/stores/main'
import {
  mdiAccountMultiple,
  mdiCartOutline,
  mdiChartTimelineVariant,
  mdiMonitorCellphone,
  mdiReload,
  mdiGithub,
  mdiChartPie,
} from '@mdi/js'
import * as chartConfig from '@/components/Charts/chart.config.js'
import LineChart from '@/components/Charts/LineChart.vue'
import SectionMain from '@/components/SectionMain.vue'
import CardBoxWidget from '@/components/CardBoxWidget.vue'
import CardBox from '@/components/CardBox.vue'
import TableSampleClients from '@/components/TableSampleClients.vue'
import NotificationBar from '@/components/NotificationBar.vue'
import BaseButton from '@/components/BaseButton.vue'
import CardBoxTransaction from '@/components/CardBoxTransaction.vue'
import CardBoxClient from '@/components/CardBoxClient.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import SectionTitleLineCustom from '@/components/SectionTitleLineCustom.vue'
import SectionBannerCustom from '@/components/SectionBannerCustom.vue'
import SectionBannerStarOnGitHub from '@/components/SectionBannerStarOnGitHub.vue'
import SectionTitle from '@/components/SectionTitle.vue'

const chartData = ref(null)
const year = new Date().getFullYear()

const fillChartData = () => {
  chartData.value = chartConfig.sampleChartData()
}

onMounted(() => {
  fillChartData()
})

const mainStore = useMainStore()

const clientBarItems = computed(() => mainStore.clients.slice(0, 4))

const transactionBarItems = computed(() => mainStore.history)
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain>
      <SectionTitleLineWithButton :icon="mdiChartTimelineVariant" title="Administración" main>
        
      </SectionTitleLineWithButton>

      <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <CardBoxWidget
          :trend="year"
          trend-type="info"
          color="text-emerald-500"
          :icon="mdiAccountMultiple"
          :number="86000"
          prefix="$"
          label="Valor administración"
        />
        <CardBoxWidget
          :trend="year"
          trend-type="info"
          color="text-blue-500"
          :icon="mdiCartOutline"
          :number="80000"
          prefix="$"
          label="Valor parquedero carros"
        />
        <CardBoxWidget
          :trend="year"
          trend-type="alert"
          color="text-red-500"
          :icon="mdiChartTimelineVariant"
          :number="70000"
          suffix="%"
          label="Valor parquedero motos"
        />
      </div>

      <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <CardBoxWidget
          :trend="year"
          trend-type="up"
          color="text-emerald-500"
          :icon="mdiAccountMultiple"
          :number="5000"
          prefix="$"
          label="Valor parqueadero bicicleta"
        />
        <CardBoxWidget
          :trend="year"
          trend-type="down"
          color="text-blue-500"
          :icon="mdiCartOutline"
          :number="0"
          prefix="$"
          label="Valor XX-"
        />
        <CardBoxWidget
          :trend="year"
          trend-type="alert"
          color="text-red-500"
          :icon="mdiChartTimelineVariant"
          :number="0"
          suffix="%"
          label="Valor"
        />
      </div>

      <SectionTitleLineCustom :icon="mdiAccountMultiple" title="Datos Propiedad">
        
      </SectionTitleLineCustom>

      <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <CardBoxWidget
          color="text-emerald-500"
          :icon="mdiAccountMultiple"
          :number="X"
          label="Interior"
        />
        <CardBoxWidget
          color="text-emerald-500"
          :icon="mdiAccountMultiple"
          :number="X"
          label="Apartamento"
        />
        <div v-if="type === 'A'">
          <CardBoxWidget
          color="text-emerald-500"
          :icon="mdiAccountMultiple"
          :number="X"
          label="Parqueadero Asignado"
          />
        </div>
        <CardBoxWidget
          color="text-emerald-500"
          :icon="mdiAccountMultiple"
          :number="X"
          label="Estado"
        />
      </div>
      <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <CardBoxWidget
          trend="bloqueado"
          trend-type="down"
          color="text-emerald-500"
          :icon="mdiAccountMultiple"
          :number="X"
          label="casillero"
        />
        <CardBoxWidget
          color="text-emerald-500"
          :icon="mdiAccountMultiple"
          :number="X"
          label="Apartamento"
        />
        <div v-if="type === 'A'">
          <CardBoxWidget
          color="text-emerald-500"
          :icon="mdiAccountMultiple"
          :number="X"
          label="Parqueadero Asignado"
          />
        </div>
        <CardBoxWidget
          color="text-emerald-500"
          :icon="mdiAccountMultiple"
          :number="X"
          label="Estado"
        />
      </div>

    </SectionMain>
  </LayoutAuthenticated>
</template>
