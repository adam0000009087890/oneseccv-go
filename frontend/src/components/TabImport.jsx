import { useState } from 'react'
import { SelectFile, ExtractFileText } from '../../wailsjs/go/main/App'

export default function TabImport({ onGenerate, isGenerating, resultMsg, goalJob, setGoalJob }) {
  const [fileName, setFileName]       = useState('')
  const [extracting, setExtracting]   = useState(false)
  const [extracted, setExtracted]     = useState('')
  const [instruction, setInstruction] = useState('')
  const [extractError, setExtractError] = useState('')

  const handleImport = async () => {
    try {
      const path = await SelectFile('document')
      if (!path) return
      setFileName(path.split(/[\\/]/).pop())
      setExtractError('')
      setExtracted('')
      setExtracting(true)
      const text = await ExtractFileText(path)
      setExtracted(text)
    } catch (e) {
      setExtractError(String(e))
    } finally {
      setExtracting(false)
    }
  }

  const canGenerate = extracted && !isGenerating

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
    resize: 'none',
    fontFamily: 'DM Sans, sans-serif',
  }

  return (
    <div className="h-full flex flex-col overflow-hidden p-6 gap-5">

      {/* ── Drop zone ── */}
      <div>
        <p className="label">CV Source</p>
        <button onClick={handleImport} disabled={isGenerating}
          className="w-full rounded-xl p-6 text-center transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            border: fileName ? '2px dashed rgba(255,107,26,0.6)' : '2px dashed #2A3050',
            background: fileName ? 'rgba(255,107,26,0.06)' : 'rgba(8,12,24,0.5)',
          }}
          onMouseEnter={e => { if (!fileName) e.currentTarget.style.borderColor = 'rgba(255,107,26,0.35)' }}
          onMouseLeave={e => { if (!fileName) e.currentTarget.style.borderColor = '#2A3050' }}>
          {extracting ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(255,107,26,0.3)', borderTopColor: '#FF6B1A' }} />
              <p className="text-sm" style={{ color: '#8892B0' }}>Extracting text...</p>
            </div>
          ) : fileName ? (
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-2xl">📄</span>
              <p className="text-sm font-mono" style={{ color: '#FF8C42' }}>{fileName}</p>
              <p className="text-xs" style={{ color: '#8892B0' }}>Click to change file</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl opacity-30">⬆</span>
              <p className="text-sm font-semibold text-white">Import existing CV</p>
              <p className="text-xs" style={{ color: '#8892B0' }}>PDF, DOCX or TXT</p>
            </div>
          )}
        </button>

        {extractError && (
          <p className="mt-2 text-xs font-mono px-3 py-2 rounded-lg"
            style={{ color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            ✕ {extractError}
          </p>
        )}
        {extracted && (
          <div className="mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
            <p className="text-xs font-mono" style={{ color: '#10B981' }}>
              {extracted.length.toLocaleString()} characters extracted successfully
            </p>
          </div>
        )}
      </div>

      {/* ── Job goal ── */}
      <div>
        <label className="label">🎯 Target Position</label>
        <input
          type="text"
          placeholder="e.g. Senior Go Developer, Cybersecurity Engineer, Data Scientist..."
          value={goalJob}
          onChange={e => setGoalJob(e.target.value)}
          disabled={isGenerating}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#FF6B1A'}
          onBlur={e => e.target.style.borderColor = '#2A3050'}
        />
      </div>

      {/* ── AI instructions ── */}
      <div className="flex-1 flex flex-col min-h-0">
        <label className="label">💡 AI Instructions</label>
        <textarea
          rows={4}
          placeholder="e.g. Highlight backend skills and open source projects, keep it concise, use a professional tone..."
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          disabled={isGenerating}
          style={{ ...inputStyle, resize: 'none', flex: 1 }}
          onFocus={e => e.target.style.borderColor = '#FF6B1A'}
          onBlur={e => e.target.style.borderColor = '#2A3050'}
        />
      </div>

      {/* ── Generate button ── */}
      <button onClick={() => onGenerate(extracted, instruction)} disabled={!canGenerate}
        className="w-full py-4 rounded-lg font-bold text-sm tracking-widest uppercase transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: canGenerate ? '#FF6B1A' : '#FF6B1A',
          color: '#fff',
          boxShadow: canGenerate ? '0 0 25px rgba(255,107,26,0.4)' : 'none',
        }}>
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Generating...
          </span>
        ) : '⚡ GENERATE WITH AI'}
      </button>

      {/* ── Result ── */}
      {resultMsg && !isGenerating && <ResultBanner type={resultMsg.type} text={resultMsg.text} />}
    </div>
  )
}

function ResultBanner({ type, text }) {
  const isErr = type === 'error'
  return (
    <div className="rounded-xl p-4 animate-fade-in"
      style={{
        background: isErr ? 'rgba(239,68,68,0.08)' : 'rgba(255,107,26,0.08)',
        border: `1px solid ${isErr ? 'rgba(239,68,68,0.3)' : 'rgba(255,107,26,0.3)'}`,
        color: isErr ? '#EF4444' : '#FF8C42',
      }}>
      <p className="font-semibold text-sm mb-1">{isErr ? '✕ Error' : '✓ Success'}</p>
      <p className="font-mono text-xs leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  )
}