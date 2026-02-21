# OneSecCV - AI-Powered CV Generator

<div align="center">

**Generate a professional, LaTeX-quality CV in seconds using AI.**  
Built with Go, Wails v2, React, and Tailwind CSS.

[![Build](https://github.com/christbowel/oneseccv/actions/workflows/build.yml/badge.svg)](https://github.com/christbowel/oneseccv/actions)
![Go Version](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go)
![Wails](https://img.shields.io/badge/Wails-v2.11-red)
![Platform](https://img.shields.io/badge/Platform-Windows-blue?logo=windows)

</div>

---

## ✨ What is OneSecCV?

OneSecCV is a desktop application that combines **AI generation** with **LaTeX precision** to produce publication-quality CVs in PDF format.

You provide your information — either by importing an existing CV (PDF, DOCX, TXT) or filling in a structured form — and the AI engine rewrites and formats it into a polished LaTeX document, compiled instantly to PDF via MiKTeX.

No subscriptions. No cloud storage. No data sent to third parties except the AI provider for generation.

---

## 🚀 Features

| Feature | Description |
|---|---|
| **AI Generation** | Powered by Google Gemini Flash — fast, accurate, free tier available |
| **LaTeX Quality** | Output compiled via pdflatex — pixel-perfect, ATS-friendly PDFs |
| **Multiple Templates** | 5 professional CV designs included |
| **Smart Import** | Extracts text from PDF, DOCX, and TXT automatically |
| **Manual Form** | Structured 9-section input for complete control |
| **Auto Retry** | On compilation failure, AI automatically fixes LaTeX errors (up to 3 attempts) |
| **Photo Support** | Profile photo injection on supported templates |
| **Cosmic UI** | Animated star background, Neodyme-inspired orange & navy theme |
| **100% Local** | API key and output files stored on your machine only |
| **Rate Limit Handling** | Automatic retry with backoff on API rate limits |

---

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| **Language** | Go 1.21+ |
| **Desktop Framework** | [Wails v2](https://wails.io/) |
| **Frontend** | React 18 + Tailwind CSS v3 + Vite |
| **Fonts** | Syne, DM Sans, JetBrains Mono |
| **AI Engine** | Google Gemini Flash API |
| **PDF Compilation** | pdflatex (MiKTeX / TeX Live) |
| **PDF Extraction** | `ledongthuc/pdf` (pure Go) |
| **DOCX Extraction** | Native Go (zip + XML) |
| **CI/CD** | GitHub Actions |

---

## 📋 Prerequisites

- **[Go 1.21+](https://go.dev/dl/)**
- **[Node.js 20+](https://nodejs.org/)**
- **[Wails CLI v2](https://wails.io/docs/gettingstarted/installation)**
- **[MiKTeX](https://miktex.org/download)** (Windows) or **TeX Live** (Linux/Mac)
- **A Google AI API key** — free at [aistudio.google.com](https://aistudio.google.com/app/apikey)

```bash
# Install Wails
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# Verify environment
wails doctor
```

---

## 📁 Project Structure

```
oneseccv-go/
├── main.go                  # Wails entry point & window config
├── app.go                   # All frontend bindings
├── gemini.go                # AI engine HTTP client with retry
├── compiler.go              # pdflatex runner: inject, sanitize, compile, cleanup
├── extractor.go             # PDF / DOCX / TXT text extraction (pure Go)
├── registry_windows.go      # Windows PATH refresh from registry
├── registry_other.go        # Non-Windows stub
├── go.mod / go.sum
├── wails.json
├── logo.ico
├── templates/               # LaTeX .tex files
├── template_previews/       # PNG previews
├── .github/workflows/
│   └── build.yml            # CI: builds EXE on push to main
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        └── components/
            ├── StarCanvas.jsx       # Animated stars / nebulas / shooting stars
            ├── LoadingOverlay.jsx
            ├── TabTemplates.jsx
            ├── TabImport.jsx
            ├── TabManual.jsx
            └── TabAPI.jsx
```

---

## 🛠️ Setup & Development

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/oneseccv.git
cd oneseccv-go

# 2. Install frontend deps
cd frontend && npm install && cd ..

# 3. Install Go deps
go mod tidy

# 4. Run in dev mode (hot reload)
wails dev
```

---

## 📦 Building for Production

```bash
wails build
# → build/bin/OneSecCV.exe
```

---

## 🤖 CI/CD — GitHub Actions

Every push to `main` triggers `.github/workflows/build.yml`:

1. Sets up Go 1.21 + Node.js 20
2. Installs Wails CLI
3. Runs `npm install` in `frontend/`
4. Runs `wails build`
5. Uploads `OneSecCV.exe` as a downloadable artifact from the Actions tab

---

## 🎨 Adding a New Template

1. Add your `.tex` file to `templates/` — use `%% PHOTO_PLACEHOLDER` for photo injection
2. Add a PNG preview to `template_previews/`
3. Register it in `app.go` → `GetTemplates()`:

```go
{"mytemplate.tex", "My Label", "mytemplate.png"},
```

4. Rebuild — it appears automatically in the Templates tab

---

## 🔒 Privacy

- API key stored locally in `.env` next to the executable
- Transmitted only to the AI provider for generation
- No telemetry, no analytics, no accounts required
- CV files saved locally in `output/`

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---|---|
| **"No templates found"** | Ensure `templates/` exists at the project root with `.tex` files inside |
| **"pdflatex not found"** | Install MiKTeX, restart the app, allow it to auto-install missing packages |
| **"AI Engine error: 429"** | Rate limit hit — app retries automatically. Wait a moment and retry |
| **Compilation fails (3 attempts)** | Check the `.tex` in `output/` manually, or try a different template |
| **White screen on launch** | Run `npm install` in `frontend/` and rebuild |
| **Templates show as missing** | In dev mode, run `wails dev` from the project root |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

**Christ Bowel**  
OneSecCV v2.0 - AI Engine Edition

---

<div align="center">
<sub>Built with Go · Wails · React · LaTeX</sub>
</div>
