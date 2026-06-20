import { defineStore } from "pinia";
import api from "@/stores/conf"; // instancia Axios con baseURL configurado

/**
 * parkingReservations.js
 * 
 * Store Pinia para gestionar reservas de parqueadero de visitantes.
 * Proporciona acciones para listar, crear, obtener, cancelar y completar reservas.
 * 
 * Endpoint base: POST /parking/reservations/
 * Requiere permiso: "parking:write" (para crear/actualizar/cancelar)
 */

/**
 * Helper: extrae mensajes de error típicos de FastAPI/Axios
 * - Si el error viene como string, lo retorna.
 * - Si es un array (errores de validación Pydantic), lo procesa.
 * - Si es otro formato, retorna un mensaje genérico.
 */
function parseAxiosError(err) {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    // Errores de validación Pydantic (lista de objetos con 'msg')
    return detail.map(d => d?.msg ?? JSON.stringify(d)).join(", ");
  }

  return err?.message || "Error inesperado";
}

export const useParkingReservationsStore = defineStore("parkingReservations", {
  state: () => ({
    // Lista de reservas
    reservations: [],

    // Estado de carga y errores
    loading: false,
    error: null,

    // Paginación por defecto (coincide con endpoint)
    pagination: {
      limit: 100,
      offset: 0,
      //role: null, <-NO
      //user_id: null, <-NO
    },

    // Control de carga inicial
    loaded: false,
  }),

  getters: {
    /**
     * getter byId(id): Busca una reserva por su ID en la lista.
     */
    byId: (state) => (id) => state.reservations.find(r => r.id === id),

    /**
     * getter hasError: true si hay un error presente.
     */
    hasError: (state) => Boolean(state.error),

    /**
     * getter count: cantidad total de reservas en estado actual.
     */
    count: (state) => state.reservations.length,
  },

  actions: {
    /**
     * clearError()
     * Limpia el mensaje de error actual.
     */
    clearError() {
      this.error = null;
    },

    /**
     * setPagination(partial)
     * Actualiza paginación (limit, offset) de forma parcial.
     */
    setPagination(partial) {
      this.pagination = { ...this.pagination, ...partial };
    },

    /**
     * GET /parking/reservations/
     * 
     * @param {Object} query - Parámetros opcionales de query
     * @param {number} query.limit - Límite de registros (default 100, máx 500)
     * @param {number} query.offset - Offset para paginación (default 0)
     * @returns {Array} Lista de reservas VisitorReservationRead
     * 
     * Requiere permiso: "parking:read"
     */
    async fetchReservations(query = {}) {
      this.loading = true;
      this.error = null;

      try {
        const params = {
          role: query.role ?? this.pagination.role,
          user_id: query.user_id ?? this.pagination.user_id,
          limit: query.limit ?? this.pagination.limit,
          offset: query.offset ?? this.pagination.offset,
        };

        // No enviar valores null/undefined
        Object.keys(params).forEach((k) => {
          if (params[k] === null || params[k] === undefined) delete params[k];
        });

        const { data } = await api.get("/parking/reservations/" + params.role + "/" + params.user_id, { params });

        this.reservations = data;
        this.loaded = true;

        // Sincroniza paginación si query trae cambios
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
     * GET /parking/reservations/
     * 
     * @param {Object} query - Parámetros opcionales de query
     * @param {number} query.limit - Límite de registros (default 100, máx 500)
     * @param {number} query.offset - Offset para paginación (default 0)
     * @returns {Array} Lista de reservas VisitorReservationRead
     * 
     * Requiere permiso: "parking:read"
     */
    async fetchReservationsByRole(query = {}) {
      this.loading = true;
      this.error = null;

      try {
        const params = {
          limit: query.limit ?? this.pagination.limit,
          offset: query.offset ?? this.pagination.offset,
        };

        // No enviar valores null/undefined
        Object.keys(params).forEach((k) => {
          if (params[k] === null || params[k] === undefined) delete params[k];
        });

        const { data } = await api.get("/parking/reservations/role/" + query.role + "/" + query.user_id, { params });

        this.reservations = data;
        this.loaded = true;

        // Sincroniza paginación si query trae cambios
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
     * GET /parking/reservations/{reservation_id}
     * 
     * @param {number} reservationId - ID de la reserva a obtener
     * @returns {Object} VisitorReservationRead o null si no existe
     * 
     * Requiere permiso: "parking:read"
     * Lanza HTTPException 404 si no existe.
     */
    async getReservation(reservationId) {
      this.loading = true;
      this.error = null;

      try {
        const { data } = await api.get(`/parking/reservations/${reservationId}`);
        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /**
     * POST /parking/reservations/
     * 
     * Crea una nueva reserva de parqueadero para visitante.
     * 
     * @param {Object} payload - Datos de la reserva (VisitorReservationCreate)
     * @param {number} payload.spot_id - ID del puesto (puede ser null si no se conoce)
     * @param {number} payload.casa_apto_interior_torre_id - ID de la relación torre/interior + apto
     * @param {string} payload.starts_at - Fecha/hora de inicio (ISO 8601)
     * @param {string} payload.ends_at - Fecha/hora de fin (ISO 8601)
     * @param {string} payload.visitor_type_document - Tipo documento (CC, TI, NIT, etc.)
     * @param {string} payload.visitor_document_number - Número de documento
     * @param {string} payload.visitor_name - Nombre completo del visitante
     * @param {string} payload.visitor_email - Email del visitante
     * @param {string} payload.visitor_cell - Celular del visitante
     * @param {number} payload.billed_minutes - Minutos a facturar
     * 
     * @returns {Object} VisitorReservationRead (con ID asignado por backend)
     * 
     * Requiere permiso: "parking:write"
     * Lanza HTTPException 400 si há validación/lógica fallida (ValueError).
     */
    async createReservation(payload) {
      this.loading = true;
      this.error = null;

      try {
        const { data } = await api.post("/parking/reservations", payload);

        // Añade la nueva reserva al inicio de la lista
        this.reservations = [data, ...this.reservations];

        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        // Lanza para que el componente pueda capturar específicamente
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * POST /parking/reservations/{reservation_id}/cancel
     * 
     * Cancela una reserva existente.
     * 
     * @param {number} reservationId - ID de la reserva a cancelar
     * @returns {boolean} true si canceló exitosamente
     * 
     * Requiere permiso: "parking:write"
     * Retorna 204 (sin contenido) / 404 si no existe.
     */
    async cancelReservation(reservationId) {
      this.loading = true;
      this.error = null;

      try {
        await api.post(`/parking/reservations/${reservationId}/cancel`);

        // Remueve de la lista local o marca como cancelada
        const idx = this.reservations.findIndex(r => r.id === reservationId);
        if (idx >= 0) {
          // Opción 1: Remover definitivamente
          this.reservations.splice(idx, 1);
          // Opción 2: Marcar como cancelada (si el backend devuelve estado)
          // this.reservations[idx] = { ...this.reservations[idx], status: 'CANCELLED' };
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
     * POST /parking/reservations/{reservation_id}/complete
     * 
     * Marca una reserva como completada.
     * 
     * @param {number} reservationId - ID de la reserva a completar
     * @returns {boolean} true si completó exitosamente
     * 
     * Requiere permiso: "parking:write"
     * Retorna 204 (sin contenido) / 404 si no existe.
     */
    async completeReservation(reservationId) {
      this.loading = true;
      this.error = null;

      try {
        await api.post(`/parking/reservations/${reservationId}/complete`);

        // Actualiza estado local (si el backend devuelve una actualización)
        const idx = this.reservations.findIndex(r => r.id === reservationId);
        if (idx >= 0) {
          // Opción: marcar como completada
          this.reservations[idx] = { ...this.reservations[idx], status: 'COMPLETED' };
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
     * reset()
     * Reinicia el store completamente (útil al logout o cambio de vista).
     */
    reset() {
      this.reservations = [];
      this.loading = false;
      this.error = null;
      this.pagination = { limit: 100, offset: 0 };
      this.loaded = false;
    },
  },
});
