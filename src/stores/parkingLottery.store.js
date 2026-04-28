import { defineStore } from "pinia";
import api from "@/stores/conf";

/**
 * parkingLottery.store.js
 * 
 * Store Pinia para gestionar el sistema de lottery/sorteo de parqueaderos.
 * Proporciona acciones para configuraciones, rondas, ejecución de sorteos
 * y gestión de comportamiento de residentes.
 * 
 * Endpoints base: /parking/lottery
 * 
 * NOTA: La autenticación está en construcción, por lo que el perfil de usuario
 * se simula aquí temporalmente hasta que esté implementado el sistema de sesión.
 */

/**
 * Helper: extrae mensajes de error típicos de FastAPI/Axios
 */
function parseAxiosError(err) {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map(d => d?.msg ?? JSON.stringify(d)).join(", ");
  }

  return err?.message || "Error inesperado";
}

/**
 * Simulación de perfil de usuario administrador
 * TODO: Reemplazar con fetching real cuando el sistema de sesión esté implementado
 */
function getSimulatedAdminProfile() {
  return {
    id: 1,
    name: "Administrador",
    email: "admin@fontibon.com",
    role: "admin",
    permissions: [
      "parking:lottery:read",
      "parking:lottery:write",
      "parking:lottery:execute"
    ]
  };
}

export const useParkingLotteryStore = defineStore("parkingLottery", {
  state: () => ({
    // Configuraciones del lottery
    configs: [],
    
    // Rondas del lottery
    rounds: [],
    
    // Resultados de una ronda específica
    currentRoundResults: null,
    
    // Participantes de una ronda
    participants: [],
    
    // Comportamiento de un residente
    residentBehavior: null,
    
    // Estado de carga y errores
    loading: false,
    error: null,
    successMessage: null,
    
    // Paginación
    pagination: {
      limit: 100,
      offset: 0,
    },
    
    // Control de carga inicial
    loadedOnce: false,
    
    // Perfil de usuario simulado (temporal)
    currentUser: getSimulatedAdminProfile(),
  }),

  getters: {
    /**
     * Verifica si el usuario tiene un permiso específico
     */
    hasPermission: (state) => (permission) => {
      return state.currentUser?.permissions?.includes(permission) ?? false;
    },
    
    /**
     * Obtiene una configuración por ID
     */
    configById: (state) => (id) => state.configs.find(c => c.id === id),
    
    /**
     * Obtiene una ronda por ID
     */
    roundById: (state) => (id) => state.rounds.find(r => r.id === id),
    
    /**
     * Obtiene las rondas activas (no canceladas)
     */
    activeRounds: (state) => state.rounds.filter(r => r.status !== 'cancelled'),
    
    /**
     * Obtiene la última ronda ejecutada
     */
    lastRound: (state) => {
      if (state.rounds.length === 0) return null;
      return state.rounds.reduce((latest, round) => {
        return new Date(round.round_date) > new Date(latest.round_date) ? round : latest;
      });
    },
  },

  actions: {
    /**
     * Limpia los mensajes de error y éxito
     */
    clearMessages() {
      this.error = null;
      this.successMessage = null;
    },

    /**
     * Limpia solo el error
     */
    clearError() {
      this.error = null;
    },
    
    /**
     * Actualiza la paginación
     */
    setPagination(partial) {
      this.pagination = { ...this.pagination, ...partial };
    },

    // ==================== CONFIGURACIONES ====================

    /**
     * GET /parking/lottery/configs
     * Lista todas las configuraciones de lottery
     */
    async fetchConfigs(query = {}) {
      this.loading = true;
      this.error = null;

      try {
        const params = {
          limit: query.limit ?? this.pagination.limit,
          offset: query.offset ?? this.pagination.offset,
        };

        Object.keys(params).forEach((k) => {
          if (params[k] === null || params[k] === undefined) delete params[k];
        });

        const { data } = await api.get("/parking/lottery/configs", { params });
        this.configs = data;
        this.loadedOnce = true;
        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        return [];
      } finally {
        this.loading = false;
      }
    },

    /**
     * GET /parking/lottery/configs/{config_id}
     * Obtiene una configuración por ID
     */
    async getConfig(configId) {
      this.loading = true;
      this.error = null;

      try {
        const { data } = await api.get(`/parking/lottery/configs/${configId}`);
        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /**
     * POST /parking/lottery/configs
     * Crea una nueva configuración
     */
    async createConfig(payload) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      try {
        const { data } = await api.post("/parking/lottery/configs", payload);
        this.configs = [data, ...this.configs];
        this.successMessage = 'Configuración creada correctamente';
        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * PATCH /parking/lottery/configs/{config_id}
     * Actualiza una configuración existente
     */
    async updateConfig(configId, payload) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      try {
        const { data } = await api.patch(`/parking/lottery/configs/${configId}`, payload);
        
        // Actualizar en la lista local
        const idx = this.configs.findIndex(c => c.id === configId);
        if (idx >= 0) {
          this.configs[idx] = data;
        }
        
        this.successMessage = 'Configuración actualizada correctamente';
        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // ==================== RONDAS ====================

    /**
     * GET /parking/lottery/rounds
     * Lista todas las rondas de lottery
     */
    async fetchRounds(query = {}) {
      this.loading = true;
      this.error = null;

      try {
        const params = {
          limit: query.limit ?? this.pagination.limit,
          offset: query.offset ?? this.pagination.offset,
        };

        Object.keys(params).forEach((k) => {
          if (params[k] === null || params[k] === undefined) delete params[k];
        });

        const { data } = await api.get("/parking/lottery/rounds", { params });
        this.rounds = data;
        this.loadedOnce = true;
        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        return [];
      } finally {
        this.loading = false;
      }
    },

    /**
     * GET /parking/lottery/rounds/{round_id}
     * Obtiene una ronda por ID
     */
    async getRound(roundId) {
      this.loading = true;
      this.error = null;

      try {
        const { data } = await api.get(`/parking/lottery/rounds/${roundId}`);
        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /**
     * GET /parking/lottery/rounds/{round_id}/results
     * Obtiene los resultados de una ronda
     */
    async getRoundResults(roundId) {
      this.loading = true;
      this.error = null;

      try {
        const { data } = await api.get(`/parking/lottery/rounds/${roundId}/results`);
        this.currentRoundResults = data;
        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /**
     * GET /parking/lottery/rounds/{round_id}/participants
     * Obtiene los participantes de una ronda
     */
    async getRoundParticipants(roundId) {
      this.loading = true;
      this.error = null;

      try {
        const { data } = await api.get(`/parking/lottery/rounds/${roundId}/participants`);
        this.participants = data;
        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        return [];
      } finally {
        this.loading = false;
      }
    },

    // ==================== EJECUCIÓN DEL SORTEO ====================

    /**
     * POST /parking/lottery/execute
     * Ejecuta un nuevo sorteo de parqueaderos
     */
    async executeLottery(payload) {
      this.loading = true;
      this.error = null;

      try {
        const { data } = await api.post("/parking/lottery/execute", payload);
        
        // Añadir la nueva ronda al inicio de la lista
        if (data.round) {
          this.rounds = [data.round, ...this.rounds];
        }
        
        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // ==================== COMPORTAMIENTO DE RESIDENTES ====================

    /**
     * GET /parking/lottery/residents/{persona_id}/behavior
     * Obtiene el registro de comportamiento de un residente
     */
    async getResidentBehavior(personaId) {
      this.loading = true;
      this.error = null;

      try {
        const { data } = await api.get(`/parking/lottery/residents/${personaId}/behavior`);
        this.residentBehavior = data;
        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /**
     * PATCH /parking/lottery/residents/{persona_id}/behavior
     * Actualiza el comportamiento de un residente
     */
    async updateResidentBehavior(personaId, payload) {
      this.loading = true;
      this.error = null;

      try {
        const { data } = await api.patch(`/parking/lottery/residents/${personaId}/behavior`, payload);
        this.residentBehavior = data;
        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * POST /parking/lottery/residents/{persona_id}/warning
     * Registra un nuevo llamado de atención
     */
    async addWarning(personaId, warningType, description, incidentDate) {
      this.loading = true;
      this.error = null;

      try {
        const { data } = await api.post(
          `/parking/lottery/residents/${personaId}/warning`,
          null,
          {
            params: {
              warning_type: warningType,
              description: description,
              incident_date: incidentDate,
            }
          }
        );
        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * PATCH /parking/lottery/residents/{persona_id}/payment-status
     * Actualiza el estado de pago de un residente
     */
    async updatePaymentStatus(personaId, isCompliant) {
      this.loading = true;
      this.error = null;

      try {
        const { data } = await api.patch(
          `/parking/lottery/residents/${personaId}/payment-status`,
          null,
          {
            params: {
              is_compliant: isCompliant,
            }
          }
        );
        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * GET /parking/lottery/residents/{persona_id}/eligibility
     * Verifica la elegibilidad de un residente
     */
    async checkEligibility(personaId, configId = null) {
      this.loading = true;
      this.error = null;

      try {
        const params = configId ? { config_id: configId } : {};
        const { data } = await api.get(`/parking/lottery/residents/${personaId}/eligibility`, { params });
        return data;
      } catch (err) {
        this.error = parseAxiosError(err);
        return null;
      } finally {
        this.loading = false;
      }
    },

    // ==================== UTILIDADES ====================

    /**
     * Reinicia el store
     */
    reset() {
      this.configs = [];
      this.rounds = [];
      this.currentRoundResults = null;
      this.participants = [];
      this.residentBehavior = null;
      this.loading = false;
      this.error = null;
      this.pagination = { limit: 100, offset: 0 };
      this.loadedOnce = false;
      this.currentUser = getSimulatedAdminProfile();
    },

    /**
     * Actualiza el perfil de usuario simulado
     * TODO: Eliminar cuando el sistema de sesión esté implementado
     */
    setSimulatedUser(userData) {
      this.currentUser = {
        ...this.currentUser,
        ...userData,
      };
    },
  },
});
