import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Role } from '../types'
import { getMe, refreshToken } from '../api/auth.api'
import { setAccessToken, clearAccessToken } from '../utils/token'

interface AuthContextType {
  user: User | null
  role: Role | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setAuth: (accessToken: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: () => {},
  setAuth: () => {},
  logout: () => {},
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { accessToken } = await refreshToken()
        setAccessToken(accessToken)
        const me = await getMe()
        setUser(me)
      } catch {
        clearAccessToken()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    restoreSession()
  }, [])

  const setAuth = (token: string, userData: User) => {
    setAccessToken(token)
    setUser(userData)
  }

  const logout = () => {
    clearAccessToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isLoading,
        isAuthenticated: !!user,
        setUser,
        setAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
