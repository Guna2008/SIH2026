import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as authService from '../services/authService'
import { getStoredToken, setStoredToken } from '../services/api'

const AuthContext = createContext(null)

function normalizeUser(user) {
  if (!user) return null
  const rawRole = String(user.role || user.organization_type || '').trim().toUpperCase().replace(/[ -]+/g, '_')
  const aliases = { SOCIAL_WELFARE_NGO: 'NGO', SOCIAL_WELFARE_ORPHANAGE: 'ORPHANAGE', ORPHANAGE_HOME: 'ORPHANAGE', FOODBANK: 'FOOD_BANK', BIOGAS: 'BIOGAS_PLANT' }
  return { ...user, role: aliases[rawRole] || rawRole }
}

const USER_KEY = 'foodshare_user'

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setStoredUser(u) {
  if (u) {
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => normalizeUser(getStoredUser()))
  const [isLoading, setIsLoading] = useState(() => Boolean(getStoredToken()))
  const [error, setError] = useState(null)

  const loadCurrentUser = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setUser(null)
      setStoredUser(null)
      setIsLoading(false)
      return
    }
    try {
      const me = await authService.getCurrentUser()
      const normalized = normalizeUser(me)
      setUser(normalized)
      setStoredUser(normalized)
    } catch (err) {
      if (err?.status === 401) {
        setStoredToken(null)
        setStoredUser(null)
        setUser(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCurrentUser()
  }, [loadCurrentUser])

  const login = useCallback(async (credentials) => {
    setError(null)
    const data = await authService.login(credentials)
    await loadCurrentUser()
    return data
  }, [loadCurrentUser])

  const adminLogin = useCallback(async (credentials) => {
    setError(null)
    const data = await authService.adminLogin(credentials)
    await loadCurrentUser()
    return data
  }, [loadCurrentUser])

  const signup = useCallback(async (payload) => {
    setError(null)
    return authService.signup(payload)
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setStoredUser(null)
    setUser(null)
  }, [])

  // Switch role quickly in demo/development mode for pair testing
  const switchAccount = useCallback(async (email, password = 'Admin@123') => {
    try {
      if (email.toLowerCase().includes('admin')) {
        await adminLogin({ email, password })
      } else {
        await login({ email, password })
      }
      return true
    } catch (e) {
      console.error('Account switch failed:', e)
      return false
    }
  }, [login, adminLogin])

  const value = {
    user,
    role: user?.role ?? null,
    isAuthenticated: Boolean(user),
    isLoading,
    error,
    login,
    adminLogin,
    signup,
    logout,
    switchAccount,
    refresh: loadCurrentUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
