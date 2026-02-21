import { useState } from 'react'

const FIELDS = [
  { key: 'identity',   label: '👤 Identity',              placeholder: 'Full name, date of birth, nationality...',           rows: 2 },
  { key: 'contact',    label: '📍 Contact & Links',        placeholder: 'Email, phone, city, country, LinkedIn, GitHub...',   rows: 2 },
  { key: 'summary',    label: '💬 Profile Summary',        placeholder: 'Describe yourself in 2-3 impactful sentences...',    rows: 3 },
  { key: 'education',  label: '🎓 Education',              placeholder: 'Degree — School — City — 2020-2023\nRelevant courses, honours...', rows: 4 },
  { key: 'experience', label: '💼 Work Experience',        placeholder: 'Title — Company — Location — 06/2022–06/2023\n• Achievement 1\n• Achievement 2', rows: 5 },
  { key: 'projects',   label: '🚀 Projects',               placeholder: 'Project Name | Link\nDescription, tech stack, impact...', rows: 4 },
  { key: 'skills',     label: '🛠 Technical Skills',       placeholder: 'Go, Python, React, Docker, Kubernetes, PostgreSQL...', rows: 3 },
  { key: 'languages',  label: '🗣 Languages',              placeholder: 'English (native), French (C1), German (B2)...',      rows: 2 },
  { key: 'hobbies',    label: '🎨 Interests & Hobbies',   placeholder: 'Open source, photography, chess...',                 rows: 2 },
]

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
  lineHeight: 1.6,
  fontFamily: 'DM Sans, sans-serif',
}

export default function TabManual({ onGenerate, isGenerating, resultMsg }) {
  const [fields, setFields]           = useState(() => Object.fromEntries(FIELDS.map(f => [f.key, ''])))
  const [instruction, setInstruction] = useState('')

  const set = (key, val) => setFields(prev => ({ ...prev, [key]: val }))

  const buildUserData = () =>
    FIELDS.filter(f => fields[f.key].trim())
      .map(f => `${f.label.replace(/^[^\s]+\s/, '').toUpperCase()}:\n${fields[f.key].trim()}`)
      .join('\n\n')

  const filledCount = FIELDS.filter(f => fields[f.key].trim()).length
  const canGenerate = filledCount >= 2 && !isGenerating

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Progress */}
      <div className="shrink-0 px-6 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="label" style={{ marginBottom: 0 }}>Manual Form</p>
          <span className="font-mono text-xs" style={{ color: '#8892B0' }}>{filledCount}/{FIELDS.length} sections filled</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1A2040' }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${(filledCount / FIELDS.length) * 100}%`, background: 'linear-gradient(90deg, #FF6B1A, #FF8C42)' }} />
        </div>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4 min-h-0">
        {FIELDS.map(field => (
          <div key={field.key}>
            <label className="label">{field.label}</label>
            <textarea
              rows={field.rows}
              placeholder={field.placeholder}
              value={fields[field.key]}
              onChange={e => set(field.key, e.target.value)}
              disabled={isGenerating}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#FF6B1A'}
              onBlur={e => e.target.style.borderColor = '#2A3050'}
            />
          </div>
        ))}

        <div>
          <label className="label">💡 AI Instructions</label>
          <textarea
            rows={2}
            placeholder="e.g. Highlight Go skills and open source projects, keep it concise..."
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            disabled={isGenerating}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#FF6B1A'}
            onBlur={e => e.target.style.borderColor = '#2A3050'}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-6 py-4 space-y-3" style={{ borderTop: '1px solid #1A2040', background: 'rgba(8,12,24,0.6)' }}>
        {resultMsg && !isGenerating && (
          <div className="rounded-xl p-3 animate-fade-in"
            style={{
              background: resultMsg.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(255,107,26,0.08)',
              border: `1px solid ${resultMsg.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(255,107,26,0.3)'}`,
              color: resultMsg.type === 'error' ? '#EF4444' : '#FF8C42',
            }}>
            <p className="font-mono text-xs whitespace-pre-wrap leading-relaxed">{resultMsg.text}</p>
          </div>
        )}
        <button onClick={() => onGenerate(buildUserData(), instruction)} disabled={!canGenerate}
          className="w-full py-4 rounded-lg font-bold text-sm tracking-widest uppercase transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#FF6B1A', color: '#fff', boxShadow: canGenerate ? '0 0 22px rgba(255,107,26,0.35)' : 'none' }}>
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Generating...
            </span>
          ) : '✨ GENERATE WITH AI'}
        </button>
        {filledCount < 2 && (
          <p className="text-center font-mono text-xs" style={{ color: '#3A4060' }}>Fill at least 2 sections to generate</p>
        )}
      </div>
    </div>
  )
}