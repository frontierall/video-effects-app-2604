import { useState, useEffect } from 'react'

const STORAGE_KEY = 'vfx_auth'
const PASSWORD = 'v1234'

export function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') setUnlocked(true)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (input === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1')
      setUnlocked(true)
    } else {
      setError(true)
      setShake(true)
      setInput('')
      setTimeout(() => setShake(false), 500)
    }
  }

  if (unlocked) return children

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className={`w-full max-w-sm ${shake ? 'animate-bounce' : ''}`}>
        <div className="bg-gray-800 rounded-3xl border border-gray-700 p-8 shadow-2xl space-y-6">
          {/* 로고 */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Video Effects Studio</h1>
            <p className="text-sm text-gray-400">접근하려면 암호를 입력하세요</p>
          </div>

          {/* 입력 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={input}
                onChange={e => { setInput(e.target.value); setError(false) }}
                placeholder="암호 입력"
                autoFocus
                className={`w-full px-4 py-3 rounded-xl bg-gray-700 border text-white placeholder-gray-500 text-center text-lg tracking-widest focus:outline-none focus:ring-2 transition-all ${
                  error
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-gray-600 focus:ring-red-400/50'
                }`}
              />
              {error && (
                <p className="text-red-400 text-xs text-center mt-2">암호가 올바르지 않습니다</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-red-500/20"
            >
              입장
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
