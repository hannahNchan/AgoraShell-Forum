import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { type Session, type User } from '@supabase/supabase-js'
import { supabase } from '../../../services/supabase'
import { type Profile } from '../../../types'

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

export const loadAuthUser = createAsyncThunk('auth/loadAuthUser', async (_, { rejectWithValue }) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    if (!session) return { session: null, user: null, profile: null }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    return { session, user: session.user, profile }
  } catch (error: any) {
    return rejectWithValue(error.message)
  }
})

export const loginWithEmail = createAsyncThunk(
  'auth/loginWithEmail',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      })
      if (error) throw error
      return { session: data.session, user: data.user }
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

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Session | null>) => {
      state.session = action.payload
      state.user = action.payload?.user ?? null
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

      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.profile = null
        state.session = null
      })
  },
})

export const { setSession, clearError } = authSlice.actions
export default authSlice.reducer
