import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { type AppDispatch } from '../../../store'
import { verifyOtp, resendVerificationEmail } from '../store/authSlice'
import Spinner from '../../../components/shared/Spinner'

const VerifyEmailPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as any)?.email ?? ''

  const [digits, setDigits] = useState<string[]>(Array(8).fill(''))
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [resendSuccess, setResendSuccess] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!email) navigate('/register', { replace: true })
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [])

  const startCooldown = () => {
    setCooldown(60)
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (next.every((d) => d !== '') && next.join('').length === 6) {
      handleVerify(next.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
    if (!pasted) return
    const next = Array(6).fill('')
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    const focusIndex = Math.min(pasted.length, 5)
    inputRefs.current[focusIndex]?.focus()
    if (pasted.length === 6) handleVerify(pasted)
  }

  const handleVerify = async (code?: string) => {
    const otp = code ?? digits.join('')
    if (otp.length < 6) { setError('Ingresa los 8 dígitos del código'); return }
    setVerifying(true)
    setError('')
    try {
      await dispatch(verifyOtp({ email, token: otp })).unwrap()
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err ?? 'Código inválido o expirado. Solicita uno nuevo.')
      setDigits(Array(8).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setResending(true)
    setError('')
    setResendSuccess(false)
    try {
      await dispatch(resendVerificationEmail(email)).unwrap()
      setResendSuccess(true)
      startCooldown()
      setDigits(Array(8).fill(''))
      inputRefs.current[0]?.focus()
    } catch {
      setError('No se pudo reenviar el email. Intenta de nuevo.')
    } finally {
      setResending(false)
    }
  }

  const code = digits.join('')
  const isComplete = code.length === 8

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-50 border-2 border-indigo-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
            ✉️
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Verifica tu email</h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Enviamos un código de 8 dígitos a<br />
            <span className="font-semibold text-slate-700">{email}</span>
          </p>
        </div>

        <div className="flex gap-1.5 justify-center mb-6" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={verifying}
              className={`w-9 h-12 text-center text-lg font-bold rounded-xl border-2 focus:outline-none transition-colors
                ${d ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-800'}
                ${error ? 'border-red-300 bg-red-50' : ''}
                focus:border-indigo-500 disabled:opacity-50`}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4 text-center">{error}</p>
        )}

        {resendSuccess && (
          <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 mb-4 text-center">
            ✓ Código reenviado. Revisa tu bandeja.
          </p>
        )}

        <button
          onClick={() => handleVerify()}
          disabled={!isComplete || verifying}
          className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 hover:cursor-pointer mb-4"
        >
          {verifying ? <Spinner size="sm" /> : 'Verificar cuenta'}
        </button>

        <div className="text-center">
          <p className="text-sm text-slate-500 mb-2">¿No recibiste el código?</p>
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 hover:cursor-pointer transition-colors"
          >
            {resending
              ? 'Enviando...'
              : cooldown > 0
                ? `Reenviar en ${cooldown}s`
                : 'Reenviar código'}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          El código expira en 10 minutos.<br />
          Revisa también tu carpeta de spam.
        </p>
      </div>
    </div>
  )
}

export default VerifyEmailPage
