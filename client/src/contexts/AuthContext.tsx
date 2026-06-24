// Placeholder — will be implemented in Step 3
import React, { createContext, useContext } from 'react'
import { Role } from '@/types/index'

interface AuthContextType {
  user: null
  role: Role | null
  isLoaded: boolean
  isSignedIn: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoaded: true,
  isSignedIn: false,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthContext.Provider
      value={{ user: null, role: null, isLoaded: true, isSignedIn: false }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => useContext(AuthContext)
