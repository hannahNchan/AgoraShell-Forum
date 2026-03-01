import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface ConfirmState {
  isOpen: boolean
  title: string
  message: string
}

const initialState: ConfirmState = {
  isOpen: false,
  title: '',
  message: '',
}

const confirmSlice = createSlice({
  name: 'confirm',
  initialState,
  reducers: {
    openConfirm: (state, action: PayloadAction<{ title: string; message: string }>) => {
      state.isOpen = true
      state.title = action.payload.title
      state.message = action.payload.message
    },
    closeConfirm: (state) => {
      state.isOpen = false
      state.title = ''
      state.message = ''
    },
  },
})

export const { openConfirm, closeConfirm } = confirmSlice.actions
export default confirmSlice.reducer
