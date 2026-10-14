import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, csrf, errorMessage } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/me')
      setUser(data.user)
    } catch (failure) {
      setUser(null)
      if (failure.response?.status !== 401) setError(errorMessage(failure))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      response => response,
      failure => {
        if ([401, 419].includes(failure.response?.status)) setUser(null)
        return Promise.reject(failure)
      },
    )
    refresh()
    return () => api.interceptors.response.eject(interceptor)
  }, [refresh])

  async function authenticate(endpoint, values) {
    await csrf()
    const { data } = await api.post(endpoint, values)
    setUser(data.user)
    setError('')
    return data.user
  }

  async function logout() {
    await csrf()
    await api.post('/logout')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, setUser, loading, error, refresh, logout, authenticate }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
