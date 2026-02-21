package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// ─────────────────────────────────────────────────────────────
// TYPES EXPOSED TO FRONTEND
// ─────────────────────────────────────────────────────────────

// Template describes a CV template available in the app.
type Template struct {
	File    string `json:"file"`
	Label   string `json:"label"`
	Preview string `json:"preview"` // base64-encoded PNG
}

// GenerateRequest is the payload sent from the frontend to trigger CV generation.
type GenerateRequest struct {
	UserData     string `json:"userData"`
	Instruction  string `json:"instruction"`
	GoalJob      string `json:"goalJob"`
	TemplateName string `json:"templateName"`
	WithPhoto    bool   `json:"withPhoto"`
	PhotoPath    string `json:"photoPath"`
}

// GenerateResult is returned to the frontend after a generation attempt.
type GenerateResult struct {
	Success   bool   `json:"success"`
	Message   string `json:"message"`
	OutputDir string `json:"outputDir"`
}

// AppStatus is used to communicate app-wide status to the frontend.
type AppStatus struct {
	APIReady   bool   `json:"apiReady"`
	LatexReady bool   `json:"latexReady"`
	APIKeyMask string `json:"apiKeyMask"`
}

// ─────────────────────────────────────────────────────────────
// APP STRUCT
// ─────────────────────────────────────────────────────────────

// App is the main application struct. All exported methods become
// callable from the frontend via Wails bindings.
type App struct {
	ctx    context.Context
	gemini *GeminiClient
	apiKey string
}

// NewApp creates a new App instance.
func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// Load API key from .env file at startup
	a.apiKey = loadAPIKeyFromEnv()
	if a.apiKey != "" {
		a.gemini = NewGeminiClient(a.apiKey)
	}
}

func (a *App) shutdown(ctx context.Context) {}

// ─────────────────────────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────────────────────────

// GetStatus returns the current app status (API ready, LaTeX ready).
func (a *App) GetStatus() AppStatus {
	masked := ""
	if len(a.apiKey) > 8 {
		masked = a.apiKey[:4] + strings.Repeat("•", len(a.apiKey)-8) + a.apiKey[len(a.apiKey)-4:]
	}
	return AppStatus{
		APIReady:   a.gemini != nil && a.apiKey != "",
		LatexReady: IsLatexAvailable(),
		APIKeyMask: masked,
	}
}

// ─────────────────────────────────────────────────────────────
// API KEY MANAGEMENT
// ─────────────────────────────────────────────────────────────

// SaveAPIKey persists the API key to .env and reinitialises the Gemini client.
func (a *App) SaveAPIKey(key string) error {
	key = strings.TrimSpace(key)
	if key == "" {
		return fmt.Errorf("API key cannot be empty")
	}
	if len(key) < 20 {
		return fmt.Errorf("clé API invalide — elle doit faire au moins 20 caractères")
	}

	envPath := userEnvPath()
	if err := os.WriteFile(envPath, []byte("GEMINI_API_KEY="+key), 0600); err != nil {
		return fmt.Errorf("failed to save API key: %w", err)
	}

	a.apiKey = key
	a.gemini = NewGeminiClient(key)
	return nil
}

// GetAPIKey returns the current API key (unmasked) for the settings field.
func (a *App) GetAPIKey() string {
	return a.apiKey
}

// ─────────────────────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────────────────────

// GetTemplates returns the list of available CV templates with base64-encoded previews.
func (a *App) GetTemplates() ([]Template, error) {
	defined := []struct{ file, label, preview string }{
		{"jake.tex", "Jake", "jake.png"},
		{"elegant.tex", "Elegant", "elegant.png"},
		{"render.tex", "Render", "render.png"},
		{"swe.tex", "SWE", "swe.png"},
		{"two-column.tex", "Two Column", "two-column.png"},
	}

	var templates []Template
	for _, t := range defined {
		texPath := resourcePath(filepath.Join("templates", t.file))
		if _, err := os.Stat(texPath); os.IsNotExist(err) {
			continue // Skip templates that don't exist on disk
		}

		preview := ""
		previewPath := resourcePath(filepath.Join("template_previews", t.preview))
		if data, err := os.ReadFile(previewPath); err == nil {
			preview = "data:image/png;base64," + base64.StdEncoding.EncodeToString(data)
		}

		templates = append(templates, Template{
			File:    t.file,
			Label:   t.label,
			Preview: preview,
		})
	}

	if len(templates) == 0 {
		return nil, fmt.Errorf("no templates found in the 'templates/' folder — check your installation")
	}
	return templates, nil
}

// ─────────────────────────────────────────────────────────────
// FILE OPERATIONS
// ─────────────────────────────────────────────────────────────

// SelectFile opens a native file dialog and returns the selected path.

func (a *App) SelectFile(fileType string) (string, error) {
	var filters []wruntime.FileFilter

	switch fileType {
	case "photo":
		filters = []wruntime.FileFilter{
			{DisplayName: "Images (*.jpg, *.jpeg, *.png, *.bmp)", Pattern: "*.jpg;*.jpeg;*.png;*.bmp"},
		}
	default:
		filters = []wruntime.FileFilter{
			{DisplayName: "Documents (*.pdf, *.docx, *.txt)", Pattern: "*.pdf;*.docx;*.txt"},
		}
	}

	path, err := wruntime.OpenFileDialog(a.ctx, wruntime.OpenDialogOptions{
		Title:   "Choisir un fichier",
		Filters: filters,
	})
	if err != nil {
		return "", fmt.Errorf("erreur lors de l'ouverture du sélecteur de fichier: %w", err)
	}
	return path, nil
}

// ExtractFileText extracts plain text from a PDF, DOCX, or TXT file.
func (a *App) ExtractFileText(filePath string) (string, error) {
	if filePath == "" {
		return "", fmt.Errorf("no file selected")
	}
	return ExtractText(filePath)
}

// OpenOutputFolder opens the output directory in the system file explorer.
func (a *App) OpenOutputFolder() error {
	dir := userDataPath("output")
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return fmt.Errorf("le dossier de sortie n'existe pas encore")
	}

	switch runtime.GOOS {
	case "windows":
		return exec.Command("explorer", dir).Start()
	case "darwin":
		return exec.Command("open", dir).Start()
	default:
		return exec.Command("xdg-open", dir).Start()
	}
}

// ─────────────────────────────────────────────────────────────
// LATEX STATUS
// ─────────────────────────────────────────────────────────────

// CheckLatex checks if pdflatex is available.
func (a *App) CheckLatex() bool {
	return IsLatexAvailable()
}

// ─────────────────────────────────────────────────────────────
// MAIN GENERATION PIPELINE
// ─────────────────────────────────────────────────────────────

// GenerateCV is the main orchestration function.
// It builds the prompt, calls Gemini, writes the .tex, compiles, and returns the result.
func (a *App) GenerateCV(req GenerateRequest) GenerateResult {
	// ── Pre-flight checks ────────────────────────────────────────────────────
	if a.gemini == nil || a.apiKey == "" {
		return GenerateResult{
			Success: false,
			Message: "❌ API key missing — configure it in the Settings tab",
		}
	}
	if !IsLatexAvailable() {
		return GenerateResult{
			Success: false,
			Message: "❌ pdflatex not found — install MiKTeX from https://miktex.org/download",
		}
	}
	if strings.TrimSpace(req.UserData) == "" {
		return GenerateResult{
			Success: false,
			Message: "❌ No user data — import a file or fill in the form",
		}
	}
	if req.TemplateName == "" {
		return GenerateResult{
			Success: false,
			Message: "❌ No template selected",
		}
	}

	// ── Load template ────────────────────────────────────────────────────────
	tplPath := resourcePath(filepath.Join("templates", req.TemplateName))
	tplCode, err := os.ReadFile(tplPath)
	if err != nil {
		return GenerateResult{
			Success: false,
			Message: fmt.Sprintf("❌ Template '%s' not found: %v", req.TemplateName, err),
		}
	}

	// ── Photo instruction ────────────────────────────────────────────────────
	usePhoto := req.WithPhoto && req.PhotoPath != ""
	photoInstruction := "If the template contains %% PHOTO_PLACEHOLDER, replace it with an empty line."
	if usePhoto {
		photoInstruction = "IMPORTANT: The template contains %% PHOTO_PLACEHOLDER. Keep this marker EXACTLY as-is. Do NOT generate the photo command."
	}

	// ── Build prompt ─────────────────────────────────────────────────────────
	prompt := fmt.Sprintf(`You are the CV expert of OneSecCV.

USER DATA:
%s

TARGET POSITION: %s
ADDITIONAL INSTRUCTIONS: %s

LATEX TEMPLATE SOURCE:
%s

%s

STRICT TECHNICAL RULES:
- Return ONLY the raw LaTeX code, no markdown or explanation.
- Start with \documentclass and end with \end{document}.
- Fill ALL sections with the provided user data.
- Escape special LaTeX characters (&, %%, $$, #, _).
- Use standard dashes (- or --) for date ranges.
- Do not invent any information not present in the user data.`,
		req.UserData,
		req.GoalJob,
		req.Instruction,
		string(tplCode),
		photoInstruction,
	)

	// ── Generate LaTeX via Gemini ─────────────────────────────────────────────
	latexCode, err := a.gemini.GenerateLatex(prompt)
	if err != nil {
		return GenerateResult{
			Success: false,
			Message: fmt.Sprintf("❌ AI Engine error: %v", err),
		}
	}

	// ── Write .tex file ───────────────────────────────────────────────────────
	outputDir := userDataPath("output")
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return GenerateResult{
			Success: false,
			Message: fmt.Sprintf("❌ Failed to create output directory: %v", err),
		}
	}

	timestamp := time.Now().Format("20060102_150405")
	outputBase := filepath.Join(outputDir, "cv_oneseccv_"+timestamp)
	texPath := outputBase + ".tex"

	if err := os.WriteFile(texPath, []byte(latexCode), 0644); err != nil {
		return GenerateResult{
			Success: false,
			Message: fmt.Sprintf("❌ Failed to write .tex file: %v", err),
		}
	}

	// ── Attempt compilation with retry on AI fix ──────────────────────────────
	photoPath := ""
	if usePhoto {
		photoPath = req.PhotoPath
	}

	const maxAttempts = 3
	var result CompileResult

	currentCode := latexCode
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		result = Compile(texPath, photoPath)
		if result.Success {
			Cleanup(texPath)
			return GenerateResult{
				Success:   true,
				Message:   "✨ CV generated successfully!",
				OutputDir: outputDir,
			}
		}

		// Don't retry on last attempt
		if attempt == maxAttempts {
			break
		}

		// Ask Gemini to fix the LaTeX error
		fixPrompt := fmt.Sprintf(`The following LaTeX code failed to compile.

ERROR:
%s

FAULTY CODE:
%s

Fix ONLY the compilation error. Keep the same content and structure.
Return ONLY the fixed LaTeX code, no markdown.`,
			result.ErrorLog,
			currentCode,
		)

		fixedCode, fixErr := a.gemini.GenerateLatex(fixPrompt)
		if fixErr != nil {
			break // Can't retry without API
		}

		currentCode = fixedCode
		if err := os.WriteFile(texPath, []byte(currentCode), 0644); err != nil {
			break
		}

		time.Sleep(2 * time.Second)
	}

	return GenerateResult{
		Success: false,
		Message: fmt.Sprintf("❌ Compilation échouée après %d tentatives.\n\nErreur LaTeX:\n%s\n\nLe fichier .tex est disponible dans output/",
			maxAttempts, result.ErrorLog),
	}
}

// ─────────────────────────────────────────────────────────────
// PATH HELPERS
// ─────────────────────────────────────────────────────────────

// resourcePath resolves a path relative to the executable (or working dir in dev).
func resourcePath(rel string) string {

	if _, err := os.Stat(rel); err == nil {
		abs, _ := filepath.Abs(rel)
		return abs
	}
	exe, err := os.Executable()
	if err != nil {
		return rel
	}
	p := filepath.Join(filepath.Dir(exe), rel)
	if _, err := os.Stat(p); err == nil {
		return p
	}

	return rel
}

// userDataPath resolves a writable path relative to the executable directory.
func userDataPath(rel string) string {
	appData := os.Getenv("APPDATA")
	if appData == "" {
		return resourcePath(rel)
	}
	dir := filepath.Join(appData, "OneSecCV")
	os.MkdirAll(dir, 0755)
	if rel == "" {
		return dir
	}
	return filepath.Join(dir, rel)
}

// userEnvPath returns the path to the .env file.
func userEnvPath() string {
	return resourcePath(".env")
}

// loadAPIKeyFromEnv reads GEMINI_API_KEY from the .env file.
func loadAPIKeyFromEnv() string {
	data, err := os.ReadFile(userEnvPath())
	if err != nil {
		// Fallback to environment variable
		return os.Getenv("GEMINI_API_KEY")
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "GEMINI_API_KEY=") {
			return strings.TrimPrefix(line, "GEMINI_API_KEY=")
		}
	}
	return os.Getenv("GEMINI_API_KEY")
}
