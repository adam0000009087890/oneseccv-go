import { useState, useEffect, useCallback } from 'react'
import {
  GetStatus, GetTemplates, GenerateCV,
  SaveAPIKey, SelectFile, ExtractFileText,
  OpenOutputFolder
} from '../wailsjs/go/main/App'

import StarCanvas     from './components/StarCanvas'
import TabImport      from './components/TabImport'
import TabManual      from './components/TabManual'
import TabTemplates   from './components/TabTemplates'
import TabAPI         from './components/TabAPI'
import LoadingOverlay from './components/LoadingOverlay'

const TABS = [
  { id: 'templates', label: '⬡ Templates' },
  { id: 'import',    label: '↗ Import'    },
  { id: 'manual',    label: '✎ Manual'    },
  { id: 'api',       label: '⚙ Settings'  },
]

export default function App() {
  const [activeTab, setActiveTab]     = useState('templates')
  const [status, setStatus]           = useState({ apiReady: false, latexReady: false, apiKeyMask: '' })
  const [templates, setTemplates]     = useState([])
  const [selectedTpl, setSelectedTpl] = useState('')
  const [goalJob, setGoalJob]         = useState('')
  const [photoPath, setPhotoPath]     = useState('')
  const [withPhoto, setWithPhoto]     = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultMsg, setResultMsg]     = useState(null)
  const [toast, setToast]             = useState(null)
  const [lastPdfPath, setLastPdfPath] = useState(null)

  useEffect(() => {
    refreshStatus()
    GetTemplates()
      .then(tpls => { if (tpls?.length) { setTemplates(tpls); setSelectedTpl(tpls[0].file) } })
      .catch(e => showToast('error', String(e)))
  }, [])

  const refreshStatus = () => GetStatus().then(setStatus).catch(() => {})

  const showToast = useCallback((type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 5500)
  }, [])

  const handleGenerate = useCallback(async (userData, instruction = '') => {
    if (!status.apiReady)   { showToast('error', 'API key missing — configure it in ⚙ Settings'); setActiveTab('api'); return }
    if (!status.latexReady) { showToast('error', 'pdflatex not found — install MiKTeX from miktex.org'); return }
    setIsGenerating(true); setResultMsg(null); setLastPdfPath(null)
    try {
      const r = await GenerateCV({ userData, instruction, goalJob, templateName: selectedTpl, withPhoto, photoPath: withPhoto ? photoPath : '' })
      setResultMsg({ type: r.success ? 'success' : 'error', text: r.message })
      if (r.success) {
        setLastPdfPath(r.outputDir)
        showToast('success', '✨ CV generated successfully!')
      } else {
        showToast('error', 'Generation failed')
      }
    } catch(e) {
      const msg = String(e)
      setResultMsg({ type: 'error', text: msg })
      showToast('error', msg)
    } finally { setIsGenerating(false) }
  }, [status, goalJob, selectedTpl, withPhoto, photoPath, showToast])

  const openCV = () => OpenOutputFolder().catch(e => showToast('error', String(e)))

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#050810' }}>
      <StarCanvas />

      {/* ── HEADER ── */}
      <header className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ background: 'rgba(8,12,24,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1A2040' }}>

        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center glow-orange"
            style={{ background: 'linear-gradient(135deg, #FF6B1A, #CC4A00)', border: '1px solid rgba(255,107,26,0.5)' }}>
            <svg viewBox="0 0 20 20" className="w-5 h-5 fill-white">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <span className="font-display font-bold text-lg text-white tracking-tight">OneSecCV</span>
            <span className="ml-2 font-mono text-xs" style={{ color: '#FF6B1A' }}>AI Engine by Christ Bowel</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusPill label="AI Engine" ready={status.apiReady} />
          <StatusPill label="LaTeX"     ready={status.latexReady} />
          {lastPdfPath && (
            <button onClick={openCV}
              className="font-bold text-xs px-4 py-2 rounded-lg transition-all duration-200 active:scale-95"
              style={{ background: '#FF6B1A', color: '#fff', boxShadow: '0 0 16px rgba(255,107,26,0.4)' }}>
              Open CV →
            </button>
          )}
        </div>
      </header>

      {/* ── TABS ── */}
      <nav className="flex items-center gap-1 px-6 pt-2 pb-0 shrink-0"
        style={{ background: 'rgba(8,12,24,0.6)', borderBottom: '1px solid #1A2040' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── CONTENT ── */}
      <main className="flex-1 overflow-hidden relative">
        <div className={`h-full ${activeTab === 'import'    ? '' : 'hidden'}`}><TabImport    onGenerate={handleGenerate} isGenerating={isGenerating} resultMsg={resultMsg} goalJob={goalJob} setGoalJob={setGoalJob} /></div>
        <div className={`h-full ${activeTab === 'manual'    ? '' : 'hidden'}`}><TabManual    onGenerate={handleGenerate} isGenerating={isGenerating} resultMsg={resultMsg} /></div>
        <div className={`h-full ${activeTab === 'templates' ? '' : 'hidden'}`}><TabTemplates templates={templates} selectedTpl={selectedTpl} setSelectedTpl={setSelectedTpl} goalJob={goalJob} setGoalJob={setGoalJob} photoPath={photoPath} setPhotoPath={setPhotoPath} withPhoto={withPhoto} setWithPhoto={setWithPhoto} /></div>
        <div className={`h-full ${activeTab === 'api'       ? '' : 'hidden'}`}><TabAPI currentKey={status.apiKeyMask} onSave={async key => { await SaveAPIKey(key); refreshStatus(); showToast('success', 'API key activated!') }} showNotification={showToast} /></div>
        {isGenerating && <LoadingOverlay />}
      </main>

      {toast && <Toast type={toast.type} text={toast.text} onClose={() => setToast(null)} />}

      {/* ── FOOTER ── */}
      <footer className="flex items-center justify-center px-6 py-2 shrink-0"
        style={{ background: 'rgba(8,12,24,0.7)', borderTop: '1px solid #1A2040' }}>
        <span className="font-mono text-xs text-white">
          © 2026 OneSecCV — Designed &amp; Developed by <span style={{ color: '#FF6B1A' }}>Christ Bowel</span>
        </span>
      </footer>
    </div>
  )
}

function StatusPill({ label, ready }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full"
      style={{
        border: `1px solid ${ready ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
        background: ready ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        color: ready ? '#10B981' : '#EF4444',
      }}>
      <span className={`w-1.5 h-1.5 rounded-full ${ready ? 'animate-pulse-slow' : ''}`}
        style={{ background: ready ? '#10B981' : '#EF4444' }} />
      {label}
    </div>
  )
}

function Toast({ type, text, onClose }) {
  const isErr = type === 'error'
  return (
    <div className="fixed bottom-12 right-4 max-w-sm z-50 animate-slide-up flex items-start gap-3 p-4 rounded-xl"
      style={{
        background: isErr ? 'rgba(239,68,68,0.1)' : 'rgba(255,107,26,0.1)',
        border: `1px solid ${isErr ? 'rgba(239,68,68,0.35)' : 'rgba(255,107,26,0.35)'}`,
        color: isErr ? '#EF4444' : '#FF8C42',
      }}>
      <span className="text-base mt-0.5">{isErr ? '✕' : '✓'}</span>
      <p className="flex-1 text-sm leading-snug whitespace-pre-line">{text}</p>
      <button onClick={onClose} className="hover:text-white transition-colors ml-1 text-xs">✕</button>
    </div>
  )
}