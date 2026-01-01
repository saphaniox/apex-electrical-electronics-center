import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  
  setAuth: (user, token, refreshToken = null) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
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
    set({ user: null, token: null, refreshToken: null })
  },
}))
