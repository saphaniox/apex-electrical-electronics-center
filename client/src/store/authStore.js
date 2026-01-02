import { create } from 'zustand'

// Helper function to check if token is still valid
const isTokenValid = () => {
  const expiryTime = localStorage.getItem('tokenExpiry')
  if (!expiryTime) return false
  return new Date().getTime() < parseInt(expiryTime)
}

// Helper function to get stored auth data if still valid
const getStoredAuth = () => {
  if (isTokenValid()) {
    return {
      user: JSON.parse(localStorage.getItem('user')) || null,
      token: localStorage.getItem('token') || null,
      refreshToken: localStorage.getItem('refreshToken') || null,
    }
  }
  // Clear expired auth data
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('tokenExpiry')
  return { user: null, token: null, refreshToken: null }
}

export const useAuthStore = create((set) => {
  const storedAuth = getStoredAuth()
  
  return {
    user: storedAuth.user,
    token: storedAuth.token,
    refreshToken: storedAuth.refreshToken,
    
    setAuth: (user, token, refreshToken = null, rememberMe = false) => {
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)
      
      // Set token expiry: 7 days if rememberMe, else 1 day
      const expiryDays = rememberMe ? 7 : 1
      const expiryTime = new Date().getTime() + (expiryDays * 24 * 60 * 60 * 1000)
      localStorage.setItem('tokenExpiry', expiryTime.toString())
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      set({ user, token, refreshToken })
    },
    
    setUser: (user) => {
      localStorage.setItem('user', JSON.stringify(user))
      set({ user })
    },

    updateToken: (newToken) => {
      localStorage.setItem('token', newToken)
      set({ token: newToken })
    },
    
    logout: () => {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('tokenExpiry')
      set({ user: null, token: null, refreshToken: null })
    },
  }
})
