import { defineStore } from "pinia";
import api from "./conf";
import { useAuthStore } from "./auth.store";

/**
 * Helper: extrae mensajes de error tipicos de FastAPI/Axios
 */
function parseAxiosError(err) {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map(d => d?.msg ?? JSON.stringify(d)).join(", ");
  }

  return err?.message || "Error inesperado";
}

export const useParkingSpotsStore = defineStore("parkingSpots", {
  state: () => ({
    spots: [],
    vehicleTypes: [],
    loading: false,
    error: null,

    // Filtros y paginacion por defecto (coinciden con tu endpoint)
    filters: {
      vehicle_type_id: null,
      active_only: true,
    },
    pagination: {
      limit: 100,
      offset: 0,
    },

    loaded: false,
  }),

  getters: {
    /**
     * Verifica si el usuario actual es superadministrador
     * @returns {boolean} true si el usuario tiene rol de superadmin
     * 
     * El rol puede venir como:
     * - Objeto (nuevo formato): { id: 1, name: 'superadmin', description: '...', permissions: [...] }
     * - String (legacy): 'superadmin'
     */
    isAdmin: (state) => {
      // Intentar obtener el usuario desde el store de auth
      let currentUser = null
      
      try {
        const authStore = useAuthStore()
        currentUser = authStore?.user
      } catch (e) {
        console.warn('🔍 [parkingSpots store] AuthStore no disponible, usando localStorage')
      }
      
      // Si no hay usuario en el store, intentar desde localStorage
      if (!currentUser) {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            currentUser = JSON.parse(storedUser)
          } catch (e) {
            console.error('🔍 [parkingSpots store] Error parseando user de localStorage:', e)
          }
        }
      }
      
      console.log('🔍 [parkingSpots store] isAdmin check - currentUser:', currentUser)
      console.log('🔍 [parkingSpots store] isAdmin check - user role:', currentUser?.role)
      
      if (!currentUser) return false
      
      const userRole = currentUser.role
      
      if (typeof userRole === 'object' && userRole !== null) {
        const idCheck = userRole.id === 1
        const nameCheck = userRole.name?.toLowerCase() === 'superadmin'
        console.log('🔍 [parkingSpots store] Role como objeto - id:', userRole.id, 'name:', userRole.name, 'idCheck:', idCheck, 'nameCheck:', nameCheck)
        return idCheck || nameCheck
      } else if (typeof userRole === 'string') {
        console.log('🔍 [parkingSpots store] Role como string:', userRole)
        return userRole.toLowerCase() === 'superadmin'
      }
      
      console.log('🔍 [parkingSpots store] returning false - no match')
      return false
    },
    byId: (state) => (id) => state.spots.find(s => s.id === id),
    hasError: (state) => Boolean(state.error),
  },

  actions: {
    clearError() {
      this.error = null;
    },

    setFilters(partial) {
      this.filters = { ...this.filters, ...partial };
    },

    setPagination(partial) {
      this.pagination = { ...this.pagination, ...partial };
    },

    /**
     * GET /parking/vehicle-types/active
     * Obtiene solo los tipos de vehiculos activos
     */
    async fetchVehicleTypes() {
      this.error = null;
      try {
        const { data } = await api.get("/parking/vehicle-types/active");
        this.vehicleTypes = data;
        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        return [];
      }
    },

    /**
     * GET /parking/spots/
     * Params: vehicle_type_id, active_only, limit, offset
     */
    async fetchSpots(query = {}) {
      this.loading = true;
      this.error = null;

      try {
        const params = {
          vehicle_type_id: query.vehicle_type_id ?? this.filters.vehicle_type_id,
          active_only: query.active_only ?? this.filters.active_only,
          limit: query.limit ?? this.pagination.limit,
          offset: query.offset ?? this.pagination.offset,
        };

        // No enviar null/undefined
        Object.keys(params).forEach((k) => {
          if (params[k] === null || params[k] === undefined) delete params[k];
        });

        const { data } = await api.get("/parking/spots/", { params });

        this.spots = data;
        this.loaded = true;

        // sincroniza store si query trae cambios
        if ("vehicle_type_id" in query) this.filters.vehicle_type_id = query.vehicle_type_id ?? null;
        if ("active_only" in query) this.filters.active_only = query.active_only ?? true;
        if ("limit" in query) this.pagination.limit = query.limit ?? 100;
        if ("offset" in query) this.pagination.offset = query.offset ?? 0;

        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        return [];
      } finally {
        this.loading = false;
      }
    },

    /**
     * POST /parking/spots/
     * 201 -> retorna el spot
     * 409 -> conflict (ValueError en backend)
     */
    async createSpot(payload) {
      this.loading = true;
      this.error = null;

      try {
        // Convertir precios a STRINGS para evitar notación científica de cualquier conversión
        const processedPayload = { ...payload }
        
        // Remover vehicle_type si viene (ya no se usa, se envía vehicle_type_id)
        if ('vehicle_type' in processedPayload && !('vehicle_type_id' in processedPayload)) {
          delete processedPayload.vehicle_type
        }
        
        if (processedPayload.monthly_price !== undefined && processedPayload.monthly_price !== null) {
          const parsed = parseInt(processedPayload.monthly_price, 10)
          processedPayload.monthly_price = isNaN(parsed) ? null : String(parsed)
        }
        if (processedPayload.minute_price !== undefined && processedPayload.minute_price !== null) {
          const parsed = parseInt(processedPayload.minute_price, 10)
          processedPayload.minute_price = isNaN(parsed) ? null : String(parsed)
        }
        
        const payloadString = JSON.stringify(processedPayload)
        console.log('🔍 [createSpot] Payload JSON:', payloadString)
        
        const { data } = await api.post("/parking/spots/", payloadString, {
          headers: { 'Content-Type': 'application/json' },
          transformRequest: [(d) => d]
        });

        // Si estás filtrando solo activos y el spot viene inactivo, no lo insertes.
        if (!this.filters.active_only || data?.is_active !== false) {
          this.spots = [data, ...this.spots];
        }

        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        // lanza para que el componente pueda mostrar toast/dialog
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * PATCH /parking/spots/{spot_id}
     * 404 si no existe
     */
    async updateSpot(spotId, payload) {
      this.loading = true;
      this.error = null;

      try {
        // Convertir precios a STRINGS para evitar notación científica
        const processedPayload = { ...payload }
        
        // Remover vehicle_type si viene (ya no se usa, se envía vehicle_type_id)
        if ('vehicle_type' in processedPayload && !('vehicle_type_id' in processedPayload)) {
          delete processedPayload.vehicle_type
        }
        
        if (processedPayload.monthly_price !== undefined && processedPayload.monthly_price !== null) {
          const parsed = parseInt(processedPayload.monthly_price, 10)
          processedPayload.monthly_price = isNaN(parsed) ? null : String(parsed)
        }
        if (processedPayload.minute_price !== undefined && processedPayload.minute_price !== null) {
          const parsed = parseInt(processedPayload.minute_price, 10)
          processedPayload.minute_price = isNaN(parsed) ? null : String(parsed)
        }
        
        const payloadString = JSON.stringify(processedPayload)
        console.log('🔍 [updateSpot] Payload JSON:', payloadString)
        
        const { data } = await api.patch(`/parking/spots/${spotId}`, payloadString, {
          headers: { 'Content-Type': 'application/json' },
          transformRequest: [(d) => d]
        });

        const idx = this.spots.findIndex(s => s.id === spotId);
        const shouldRemove = this.filters.active_only && data?.is_active === false;

        if (idx >= 0) {
          if (shouldRemove) {
            this.spots.splice(idx, 1);
          } else {
            this.spots.splice(idx, 1, data);
          }
        } else {
          // si no estaba en lista, lo agregamos si aplica
          if (!shouldRemove) this.spots = [data, ...this.spots];
        }

        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * POST /parking/spots/{spot_id}/deactivate
     * 204 -> no content
     * 404 -> no existe
     */
    async deactivateSpot(spotId) {
      this.loading = true;
      this.error = null;

      try {
        await api.post(`/parking/spots/${spotId}/deactivate`);

        const idx = this.spots.findIndex(s => s.id === spotId);
        if (idx >= 0) {
          if (this.filters.active_only) {
            // si solo muestras activos, quítalo de la lista
            this.spots.splice(idx, 1);
          } else {
            // si muestras todos, márcalo inactivo localmente
            this.spots[idx] = { ...this.spots[idx], is_active: false, active: false };
          }
        }

        return true;
      } catch (err) {
        this.error = parseAxiosError(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Opcional: reset total del store (útil al logout)
     */
    reset() {
      this.spots = [];
      this.loading = false;
      this.error = null;
      this.filters = { vehicle_type: null, active_only: true };
      this.pagination = { limit: 100, offset: 0 };
      this.loaded = false;
    },
  },
});
