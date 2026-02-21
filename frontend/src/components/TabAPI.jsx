import { useState } from 'react'

const inputStyle = {
  background: '#080C18',
  border: '1.5px solid #2A3050',
  borderRadius: 8,
  color: '#E8EAF0',
  width: '100%',
  padding: '10px 14px',
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: 'JetBrains Mono, monospace',
  paddingRight: 44,
}

export default function TabAPI({ currentKey, onSave, showNotification }) {
  const [key, setKey]         = useState('')
  const [saving, setSaving]   = useState(false)
  const [visible, setVisible] = useState(false)

  const handleSave = async () => {
    if (!key.trim()) return
    setSaving(true)
    try {
      await onSave(key.trim())
      setKey('')
    } catch(e) {
      showNotification('error', String(e))
    } finally { setSaving(false) }
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div style={{ maxWidth: 520, margin: '0 auto' }} className="space-y-8">

        {/* Header */}
        <div>
          <p className="label">Configuration</p>
          <h2 className="font-display font-bold text-2xl text-white">AI Engine Settings</h2>
          <p className="text-sm mt-1" style={{ color: '#8892B0' }}>
            OneSecCV uses an AI language model to generate your LaTeX code. Your key is stored locally only.
          </p>
        </div>

        {/* Current status */}
        {currentKey && (
          <div className="flex items-center gap-3 p-4 rounded-xl"
            style={{ background: '#080C18', border: '1.5px solid #2A3050' }}>
            <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: '#10B981', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">Active key</p>
              <p className="font-mono text-xs truncate mt-0.5" style={{ color: '#8892B0' }}>{currentKey}</p>
            </div>
            <span className="font-mono text-xs px-2 py-1 rounded"
              style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              READY
            </span>
          </div>
        )}

        {/* Input */}
        <div>
          <label className="label">🔑 API Key</label>
          <div className="relative">
            <input
              type={visible ? 'text' : 'password'}
              placeholder="Paste your API key here..."
              value={key}
              onChange={e => setKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#FF6B1A'}
              onBlur={e => e.target.style.borderColor = '#2A3050'}
            />
            <button type="button" onClick={() => setVisible(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm transition-colors"
              style={{ color: '#8892B0' }}
              onMouseEnter={e => e.target.style.color = '#E8EAF0'}
              onMouseLeave={e => e.target.style.color = '#8892B0'}>
              {visible ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {/* Save button */}
        <button onClick={handleSave} disabled={saving || !key.trim()}
          className="w-full py-3.5 rounded-lg font-bold text-sm tracking-widest uppercase transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#FF6B1A', color: '#fff', boxShadow: key.trim() ? '0 0 22px rgba(255,107,26,0.35)' : 'none' }}>
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Verifying...
            </span>
          ) : 'SAVE & ACTIVATE'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: '#1A2040' }} />
          <span className="text-xs font-mono" style={{ color: '#8892B0' }}>Don't have a key?</span>
          <div className="flex-1 h-px" style={{ background: '#1A2040' }} />
        </div>

        {/* Info */}
        <div className="p-5 rounded-xl space-y-3" style={{ background: '#080C18', border: '1.5px solid #2A3050' }}>
          <p className="font-semibold text-white text-sm">Get a free key in 2 minutes</p>
          <ol className="space-y-2 text-sm" style={{ color: '#8892B0' }}>
            {[
              ['01', 'Go to', 'aistudio.google.com'],
              ['02', 'Click "Get API Key" → "Create API key"', null],
              ['03', 'Copy and paste it above', null],
            ].map(([n, txt, link]) => (
              <li key={n} className="flex items-start gap-2">
                <span className="font-mono text-xs mt-0.5 shrink-0" style={{ color: '#FF6B1A' }}>{n}</span>
                <span>{txt} {link && <span className="font-mono text-xs" style={{ color: '#5B8FFF' }}>{link}</span>}</span>
              </li>
            ))}
          </ol>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg transition-all duration-200"
            style={{ background: 'rgba(255,107,26,0.1)', border: '1px solid rgba(255,107,26,0.25)', color: '#FF8C42' }}>
            Open Google AI Studio →
          </a>
        </div>

        {/* Security note */}
        <div className="flex items-start gap-3 text-xs" style={{ color: '#3A4060' }}>
          <span className="shrink-0 mt-0.5">🔒</span>
          <p>Your API key is stored locally in a <code className="font-mono px-1 rounded" style={{ background: '#0A0F1E' }}>.env</code> file on your machine. It is never sent to any external server other than the AI provider.</p>
        </div>
      </div>
    </div>
  )
}