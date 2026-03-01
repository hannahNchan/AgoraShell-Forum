import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/store/authSlice'
import channelsReducer from '../features/forums/store/forumsSlice'
import topicsReducer from '../features/threads/store/threadsSlice'
import postsReducer from '../features/posts/store/postsSlice'
import confirmReducer from './confirmSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    channels: channelsReducer,
    topics: topicsReducer,
    posts: postsReducer,
    confirm: confirmReducer
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
