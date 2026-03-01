import { useDispatch, useSelector } from 'react-redux'
import { type RootState, type AppDispatch } from '../../store'
import { closeConfirm } from '../../store/confirmSlice'
import { resolveConfirm } from '../../hooks/useConfirm'

const ConfirmModal = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { isOpen, title, message } = useSelector((state: RootState) => state.confirm)

  if (!isOpen) return null

  const handleConfirm = () => {
    resolveConfirm(true)
    dispatch(closeConfirm())
  }

  const handleCancel = () => {
    resolveConfirm(false)
    dispatch(closeConfirm())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 py-5">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          {message && <p className="text-sm text-slate-500 mt-1">{message}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={handleCancel}
            className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors hover:cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600 transition-colors hover:cursor-pointer"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
