import {create} from 'zustand'
import {persist} from 'zustand/middleware'

interface AuthState {
    token: string | null,
    updateToken: (token: string) => void,
    removeToken: () => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            updateToken: (token: string) => set({token: token}),
            removeToken: () => set({token: null})
        }),
        {
            name: 'auth-storage'
        }
    )
)
