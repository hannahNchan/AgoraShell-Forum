import { useDispatch } from 'react-redux'
import { openConfirm } from '../store/confirmSlice'
import { type AppDispatch } from '../store'

let resolveRef: ((value: boolean) => void) | null = null

export const resolveConfirm = (value: boolean) => {
  if (resolveRef) {
    resolveRef(value)
    resolveRef = null
  }
}

export const useConfirm = () => {
  const dispatch = useDispatch<AppDispatch>()

  const confirm = (title: string, message: string): Promise<boolean> => {
    dispatch(openConfirm({ title, message }))
    return new Promise((resolve) => {
      resolveRef = resolve
    })
  }

  return { confirm }
}
