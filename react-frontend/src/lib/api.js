import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
  timeout: 15000,
})

export const csrf = () => axios.get('/sanctum/csrf-cookie', { withCredentials: true, timeout: 15000 })

export function errorMessage(error) {
  const status = error.response?.status
  if (!error.response) return 'No pudimos conectar. Comprueba tu conexión e inténtalo de nuevo.'
  if (status === 419 || status === 401) return 'Tu sesión terminó. Inicia sesión de nuevo.'
  if (status === 403) return 'No tienes permiso para realizar esta acción.'
  if (status === 404) return 'Este registro ya no está disponible.'
  if (status === 429) return 'Demasiados intentos. Espera un minuto antes de volver a intentarlo.'
  if (status === 422) return 'Revisa los campos señalados.'
  return 'No pudimos completar la solicitud. Inténtalo de nuevo.'
}
