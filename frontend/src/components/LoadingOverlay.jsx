import { useState, useEffect } from 'react'

const STEPS = [
  { icon: '🤖', text: 'Analyse des données par l\'IA...', sub: 'Lecture et compréhension de votre profil' },
  { icon: '✍️', text: 'Rédaction du code LaTeX...', sub: 'Gemini génère votre CV personnalisé' },
  { icon: '🎨', text: 'Mise en forme du template...', sub: 'Application du style sélectionné' },
  { icon: '⚙️', text: 'Compilation pdflatex...', sub: 'Conversion en fichier PDF' },
  { icon: '✨', text: 'Finalisation...', sub: 'Votre CV est presque prêt' },
]

export default function LoadingOverlay() {
  const [stepIndex, setStepIndex] = useState(0)
  const [dots, setDots] = useState(0)

  useEffect(() => {
    const s = setInterval(() => setStepIndex(i => (i + 1) % STEPS.length), 2800)
    const d = setInterval(() => setDots(d => (d + 1) % 4), 500)
    return () => { clearInterval(s); clearInterval(d) }
  }, [])

  const step = STEPS[stepIndex]
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center animate-fade-in scanline-fx"
      style={{ background: 'rgba(5,8,16,0.92)', backdropFilter: 'blur(16px)' }}>

      <div className="relative w-[460px] rounded-2xl p-8 overflow-hidden"
        style={{
          background: 'rgba(8,12,24,0.95)',
          border: '1px solid rgba(255,107,26,0.3)',
          boxShadow: '0 0 60px rgba(255,107,26,0.15), 0 0 120px rgba(255,107,26,0.05)',
        }}>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-12 h-12" style={{ borderTop: '2px solid rgba(255,107,26,0.4)', borderLeft: '2px solid rgba(255,107,26,0.4)', borderRadius: '12px 0 0 0' }} />
        <div className="absolute bottom-0 right-0 w-12 h-12" style={{ borderBottom: '2px solid rgba(30,111,255,0.4)', borderRight: '2px solid rgba(30,111,255,0.4)', borderRadius: '0 0 12px 0' }} />

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center glow-orange"
            style={{ background: 'rgba(255,107,26,0.12)', border: '1px solid rgba(255,107,26,0.35)' }}>
            <span className="text-2xl">{step.icon}</span>
            {/* Spinner */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent animate-spin"
              style={{ borderTopColor: '#FF6B1A' }} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center font-display font-bold text-white text-xl mb-0.5 tracking-tight">1SecCV</h2>
        <p className="text-center font-mono text-xs mb-6 tracking-widest uppercase" style={{ color: '#FF6B1A' }}>
          Moteur IA en cours
        </p>

        {/* Step text */}
        <div className="text-center mb-2 min-h-[3rem] flex flex-col items-center justify-center">
          <p className="font-display font-semibold text-white text-sm">
            {step.text}{'.' .repeat(dots)}
          </p>
          <p className="font-mono text-xs mt-1" style={{ color: '#8892B0' }}>{step.sub}</p>
        </div>

        {/* Progress bar */}
        <div className="mt-6 mb-3">
          <div className="flex justify-between mb-1.5">
            <span className="font-mono text-xs" style={{ color: '#3A4060' }}>Progression</span>
            <span className="font-mono text-xs" style={{ color: '#FF6B1A' }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1A2040' }}>
            <div className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #FF6B1A, #FF8C42)',
                boxShadow: '0 0 10px rgba(255,107,26,0.5)',
              }} />
          </div>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-4">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === stepIndex ? 24 : 8,
                background: i === stepIndex ? '#FF6B1A' : i < stepIndex ? 'rgba(255,107,26,0.3)' : '#1A2040',
              }} />
          ))}
        </div>
      </div>
    </div>
  )
}