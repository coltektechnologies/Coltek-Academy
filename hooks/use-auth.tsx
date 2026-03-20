"use client"

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react'
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import {
  firebase,
  isFirebaseConfigured,
  FIREBASE_SETUP_HELP,
} from '@/lib/firebase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  firebaseError: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  firebaseError: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [firebaseError, setFirebaseError] = useState<string | null>(null)
  const router = useRouter()

  const signOut = useCallback(async () => {
    if (!isFirebaseConfigured()) return
    try {
      await firebaseSignOut(firebase.auth)
      setUser(null)
      router.push('/admin/login')
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }, [router])

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setFirebaseError(
        `Firebase is not configured. ${FIREBASE_SETUP_HELP}`
      )
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | undefined
    try {
      unsubscribe = onAuthStateChanged(firebase.auth, (nextUser) => {
        setUser(nextUser)
        setLoading(false)
      })
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : 'Firebase failed to initialize (check API key in Vercel).'
      console.error(e)
      setFirebaseError(`${msg} ${FIREBASE_SETUP_HELP}`)
      setLoading(false)
    }

    return () => {
      unsubscribe?.()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, signOut, firebaseError }}
    >
      {firebaseError && (
        <div
          role="alert"
          className="border-b border-amber-500/50 bg-amber-950/90 px-4 py-3 text-sm text-amber-100"
        >
          <strong className="block text-amber-50">Configuration required</strong>
          <p className="mt-1 max-w-4xl opacity-95">{firebaseError}</p>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}