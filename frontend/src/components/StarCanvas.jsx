import { useEffect, useRef } from 'react'

export default function StarCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId

    // Resize canvas to fill window
    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // ── Star types ───────────────────────────────────────────
    const STAR_COUNT   = 220
    const NEBULA_COUNT = 5

    // Regular stars
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x:       Math.random() * canvas.width,
      y:       Math.random() * canvas.height,
      r:       Math.random() * 1.5 + 0.2,
      alpha:   Math.random() * 0.7 + 0.15,
      speed:   Math.random() * 0.004 + 0.001,
      phase:   Math.random() * Math.PI * 2,
      // Rare orange or blue tint
      color:   Math.random() < 0.06 ? '#FF6B1A'
             : Math.random() < 0.08 ? '#5B8FFF'
             : '#ffffff',
    }))

    // Shooting stars
    let shooters = []
    const spawnShooter = () => ({
      x:     Math.random() * canvas.width * 0.7,
      y:     Math.random() * canvas.height * 0.4,
      len:   Math.random() * 120 + 60,
      speed: Math.random() * 6 + 4,
      angle: Math.PI / 6 + (Math.random() - 0.5) * 0.3,
      alpha: 1,
      life:  0,
      maxLife: Math.random() * 40 + 30,
    })

    // Nebula clouds (static blobs)
    const nebulas = [
      { x: canvas.width * 0.15, y: canvas.height * 0.25, r: 180, color: 'rgba(30,111,255,0.04)' },
      { x: canvas.width * 0.80, y: canvas.height * 0.15, r: 220, color: 'rgba(255,107,26,0.04)' },
      { x: canvas.width * 0.50, y: canvas.height * 0.75, r: 250, color: 'rgba(30,111,255,0.03)' },
      { x: canvas.width * 0.10, y: canvas.height * 0.80, r: 150, color: 'rgba(255,107,26,0.03)' },
      { x: canvas.width * 0.90, y: canvas.height * 0.65, r: 170, color: 'rgba(91,143,255,0.03)' },
    ]

    let frame = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // ── Background gradient ──────────────────────────────
      const bg = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.3, 0,
        canvas.width * 0.5, canvas.height * 0.3, canvas.width * 0.8
      )
      bg.addColorStop(0, '#0A0F20')
      bg.addColorStop(1, '#050810')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // ── Nebulas ──────────────────────────────────────────
      nebulas.forEach(n => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
        g.addColorStop(0, n.color)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      })

      // ── Stars ────────────────────────────────────────────
      stars.forEach(s => {
        const twinkle = s.alpha + Math.sin(frame * s.speed + s.phase) * 0.25
        ctx.globalAlpha = Math.max(0, Math.min(1, twinkle))
        ctx.fillStyle = s.color
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()

        // Glow on brighter stars
        if (s.r > 1.2) {
          ctx.globalAlpha = twinkle * 0.3
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
      })
      ctx.globalAlpha = 1

      // ── Shooting stars ───────────────────────────────────
      if (frame % 180 === 0 && Math.random() < 0.6) {
        shooters.push(spawnShooter())
      }

      shooters = shooters.filter(s => s.life < s.maxLife)
      shooters.forEach(s => {
        s.life++
        s.x += Math.cos(s.angle) * s.speed
        s.y += Math.sin(s.angle) * s.speed
        s.alpha = 1 - s.life / s.maxLife

        const grad = ctx.createLinearGradient(
          s.x, s.y,
          s.x - Math.cos(s.angle) * s.len,
          s.y - Math.sin(s.angle) * s.len
        )
        grad.addColorStop(0, `rgba(255,255,255,${s.alpha})`)
        grad.addColorStop(0.3, `rgba(200,210,255,${s.alpha * 0.5})`)
        grad.addColorStop(1, 'transparent')

        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.globalAlpha = s.alpha
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(
          s.x - Math.cos(s.angle) * s.len,
          s.y - Math.sin(s.angle) * s.len
        )
        ctx.stroke()
        ctx.globalAlpha = 1
      })

      frame++
      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      id="star-canvas"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  )
}