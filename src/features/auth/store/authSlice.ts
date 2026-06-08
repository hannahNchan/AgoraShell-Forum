import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { type Session, type User } from '@supabase/supabase-js'
import { supabase } from '../../../services/supabase'
import { type UserRole, type Profile } from '../../../types'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  profile: null,
  session: null,
  loading: true,
  error: null,
}

const roleFromId = (roleId?: number | null): UserRole => {
  if (roleId === 1) return 'admin'
  if (roleId === 2) return 'moderator'
  if (roleId === 4) return 'banned'
  return 'user'
}

type ProfileWithRole = Profile & {
  roles?: { name?: UserRole } | { name?: UserRole }[] | null
}

const normalizeProfile = (profile: ProfileWithRole): Profile => {
  const roles = profile.roles
  const roleName = Array.isArray(roles) ? roles[0]?.name : roles?.name
  const cleanProfile = { ...profile }
  delete cleanProfile.roles
  return { ...cleanProfile, role: roleName ?? profile.role ?? roleFromId(profile.role_id) }
}

const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, roles(name)')
    .eq('id', userId)
    .single()

  if (data) return normalizeProfile(data as ProfileWithRole)

  const { data: fallbackData, error: fallbackError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (fallbackData) return normalizeProfile(fallbackData as ProfileWithRole)
  if (error || fallbackError) throw error ?? fallbackError
  return null
}

const requireProfile = async (userId: string) => {
  const profile = await fetchProfile(userId)
  if (!profile) throw new Error('No se pudo cargar tu perfil. Intenta cerrar sesion e iniciar de nuevo.')
  return profile
}

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Ocurrió un error inesperado.'

export const loadAuthUser = createAsyncThunk('auth/loadAuthUser', async (_, { rejectWithValue }) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    if (!session) return { session: null, user: null, profile: null }
    const profile = await requireProfile(session.user.id)
    return { session, user: session.user, profile }
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

export const hydrateAuthSession = createAsyncThunk(
  'auth/hydrateAuthSession',
  async (session: Session | null, { rejectWithValue }) => {
    try {
      if (!session) return { session: null, user: null, profile: null }
      const profile = await requireProfile(session.user.id)
      return { session, user: session.user, profile }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const loginWithEmail = createAsyncThunk(
  'auth/loginWithEmail',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return rejectWithValue('EMAIL_NOT_CONFIRMED')
        }
        throw error
      }
      const profile = await requireProfile(data.user.id)
      return { session: data.session, user: data.user, profile }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const registerWithEmail = createAsyncThunk(
  'auth/registerWithEmail',
  async (
    { email, password, username }: { email: string; password: string; username: string },
    { rejectWithValue }
  ) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      return { email, needsVerification: true }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, token }: { email: string; token: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })
      if (error) throw error
      if (!data.session) throw new Error('No session after verification')
      const profile = await requireProfile(data.user!.id)
      return { session: data.session, user: data.user!, profile }
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const resendVerificationEmail = createAsyncThunk(
  'auth/resendVerificationEmail',
  async (email: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

export const updateAvatar = createAsyncThunk(
  'auth/updateAvatar',
  async ({ userId, blob }: { userId: string; blob: Blob | null }, { rejectWithValue }) => {
    try {
      if (!blob) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: null })
          .eq('id', userId)
        if (error) throw error
        return null
      }

      const ext = 'webp'
      const fileName = `${userId}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true, contentType: 'image/webp' })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const publicUrl = urlData.publicUrl
      const displayUrl = `${publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      return displayUrl
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateProfileSettings = createAsyncThunk(
  'auth/updateProfileSettings',
  async ({ userId, username, bio }: { userId: string; username: string; bio: string }, { rejectWithValue }) => {
    try {
      const cleanUsername = username.trim()
      const cleanBio = bio.trim()

      const { data, error } = await supabase
        .from('profiles')
        .update({
          username: cleanUsername,
          bio: cleanBio || null,
        })
        .eq('id', userId)
        .select('*, roles(name)')
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('Ese username ya está en uso.')
        }
        if (error.code === '23514') {
          throw new Error('El username debe tener 3-30 caracteres y usar solo letras, números o _.')
        }
        throw error
      }

      return normalizeProfile(data as ProfileWithRole)
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Session | null>) => {
      state.session = action.payload
      state.user = action.payload?.user ?? null
      if (!action.payload) state.profile = null
    },
    clearAuthState: (state) => {
      state.user = null
      state.profile = null
      state.session = null
      state.loading = false
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAuthUser.pending, (state) => { state.loading = true })
      .addCase(loadAuthUser.fulfilled, (state, action) => {
        state.loading = false
        state.session = action.payload.session
        state.user = action.payload.user
        state.profile = action.payload.profile
      })
      .addCase(loadAuthUser.rejected, (state) => { state.loading = false })

      .addCase(hydrateAuthSession.pending, (state) => { state.loading = true; state.error = null })
      .addCase(hydrateAuthSession.fulfilled, (state, action) => {
        state.loading = false
        state.session = action.payload.session
        state.user = action.payload.user
        state.profile = action.payload.profile
      })
      .addCase(hydrateAuthSession.rejected, (state, action) => {
        state.loading = false
        state.user = null
        state.profile = null
        state.session = null
        state.error = action.payload as string
      })

      .addCase(loginWithEmail.pending, (state) => { state.loading = true; state.error = null })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.loading = false
        state.session = action.payload.session
        state.user = action.payload.user
        state.profile = action.payload.profile
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      .addCase(registerWithEmail.pending, (state) => { state.loading = true; state.error = null })
      .addCase(registerWithEmail.fulfilled, (state) => { state.loading = false })
      .addCase(registerWithEmail.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      .addCase(verifyOtp.pending, (state) => { state.loading = true; state.error = null })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false
        state.session = action.payload.session
        state.user = action.payload.user
        state.profile = action.payload.profile
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.profile = null
        state.session = null
      })

      .addCase(updateAvatar.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.avatar_url = action.payload
        }
      })
      .addCase(updateProfileSettings.fulfilled, (state, action) => {
        state.profile = action.payload
      })
  },
})

export const { setSession, clearAuthState, clearError } = authSlice.actions
export default authSlice.reducer
