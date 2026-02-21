import { SelectFile } from '../../wailsjs/go/main/App'

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
  fontFamily: 'DM Sans, sans-serif',
}

export default function TabTemplates({ templates, selectedTpl, setSelectedTpl, goalJob, setGoalJob, photoPath, setPhotoPath, withPhoto, setWithPhoto }) {
  const selected = templates.find(t => t.file === selectedTpl)

  const handleSelectPhoto = async () => {
    try {
      const path = await SelectFile('photo')
      if (path) setPhotoPath(path)
    } catch(e) { console.error(e) }
  }

  return (
    <div className="h-full flex gap-0 overflow-hidden">

      {/* ── Left: template list ── */}
      <div className="w-52 shrink-0 flex flex-col overflow-y-auto"
        style={{ borderRight: '1px solid #1A2040', background: 'rgba(8,12,24,0.5)' }}>
        <div className="p-4" style={{ borderBottom: '1px solid #1A2040' }}>
          <p className="label" style={{ marginBottom: 4 }}>Style</p>
          <p className="text-xs" style={{ color: '#8892B0' }}>Choose a CV design</p>
        </div>

        <nav className="p-2 flex flex-col gap-1">
          {templates.length === 0 ? (
            <p className="p-4 text-xs text-center" style={{ color: '#8892B0' }}>Loading templates...</p>
          ) : templates.map(tpl => (
            <button key={tpl.file} onClick={() => setSelectedTpl(tpl.file)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
              style={{
                background: tpl.file === selectedTpl ? 'rgba(255,107,26,0.12)' : 'transparent',
                border: tpl.file === selectedTpl ? '1px solid rgba(255,107,26,0.35)' : '1px solid transparent',
                color: tpl.file === selectedTpl ? '#fff' : '#8892B0',
                boxShadow: tpl.file === selectedTpl ? '0 0 12px rgba(255,107,26,0.1)' : 'none',
              }}>
              <span className="mr-2 text-xs" style={{ color: tpl.file === selectedTpl ? '#FF6B1A' : '#3A4060' }}>▸</span>
              {tpl.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Right: preview + options ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Preview */}
        <div className="flex-1 p-5 overflow-hidden flex flex-col">
          <p className="label">Preview</p>
          <div className="flex-1 flex items-center justify-center rounded-xl overflow-hidden min-h-0"
            style={{ background: '#080C18', border: '1.5px solid #2A3050' }}>
            {selected?.preview ? (
              <img src={selected.preview} alt={`Preview ${selected.label}`}
                className="max-h-full max-w-full object-contain rounded-lg" />
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-3 opacity-20">📄</div>
                <p className="text-sm" style={{ color: '#8892B0' }}>No preview available</p>
                {selected && <p className="font-mono text-xs mt-1" style={{ color: '#3A4060' }}>{selected.file}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="shrink-0 p-5 space-y-4" style={{ borderTop: '1px solid #1A2040', background: 'rgba(8,12,24,0.6)' }}>

          {/* Target job */}
          <div>
            <label className="label">🎯 Target Position</label>
            <input type="text"
              placeholder="e.g. Cybersecurity Engineer, Data Scientist, Cloud Architect..."
              value={goalJob}
              onChange={e => setGoalJob(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#FF6B1A'}
              onBlur={e => e.target.style.borderColor = '#2A3050'}
            />
          </div>

          {/* Photo toggle */}
          <div className="flex items-center justify-between px-4 py-3 rounded-lg"
            style={{ background: '#080C18', border: '1.5px solid #2A3050' }}>
            <div>
              <p className="text-sm text-white">Profile Photo</p>
              <p className="text-xs mt-0.5" style={{ color: '#8892B0' }}>
                {withPhoto ? (photoPath ? `📷 ${photoPath.split(/[\\/]/).pop()}` : 'No photo selected') : 'Not included'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {withPhoto && (
                <button onClick={handleSelectPhoto}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
                  style={{ background: 'rgba(255,107,26,0.15)', border: '1px solid rgba(255,107,26,0.35)', color: '#FF8C42' }}>
                  Browse...
                </button>
              )}
              <Toggle value={withPhoto} onChange={setWithPhoto} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
      style={{ background: value ? '#FF6B1A' : '#1A2040', boxShadow: value ? '0 0 10px rgba(255,107,26,0.4)' : 'none' }}>
      <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: value ? 'translateX(24px)' : 'translateX(4px)' }} />
    </button>
  )
}