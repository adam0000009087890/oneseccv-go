package main

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
)

// ─────────────────────────────────────────────────────────────
// PDFLATEX DETECTION
// ─────────────────────────────────────────────────────────────

// FindPdfLatex searches for the pdflatex binary on the current system.
func FindPdfLatex() (string, error) {
	// Refresh PATH from Windows registry before searching
	if runtime.GOOS == "windows" {
		refreshWindowsPath()
	}

	if path, err := exec.LookPath("pdflatex"); err == nil {
		return path, nil
	}

	if runtime.GOOS != "windows" {
		return "", fmt.Errorf("pdflatex not found — install TeX Live:\n  Ubuntu/Debian: sudo apt install texlive-full\n  Mac: https://tug.org/mactex/")
	}

	// Known Windows paths for MiKTeX and TeX Live
	candidates := []string{
		filepath.Join(os.Getenv("LOCALAPPDATA"), `Programs\MiKTeX\miktex\bin\x64\pdflatex.exe`),
		filepath.Join(os.Getenv("APPDATA"), `MiKTeX\miktex\bin\x64\pdflatex.exe`),
		`C:\Program Files\MiKTeX\miktex\bin\x64\pdflatex.exe`,
		`C:\Program Files (x86)\MiKTeX\miktex\bin\x64\pdflatex.exe`,
	}

	// Scan TeX Live installations
	texLiveRoot := `C:\texlive`
	if entries, err := os.ReadDir(texLiveRoot); err == nil {
		for _, e := range entries {
			if e.IsDir() {
				for _, sub := range []string{`bin\windows`, `bin\win32`} {
					candidates = append(candidates, filepath.Join(texLiveRoot, e.Name(), sub, "pdflatex.exe"))
				}
			}
		}
	}

	for _, p := range candidates {
		if _, err := os.Stat(p); err == nil {
			return p, nil
		}
	}

	return "", fmt.Errorf("pdflatex not found — install MiKTeX from https://miktex.org/download")
}

// IsLatexAvailable returns true if pdflatex can be found.
func IsLatexAvailable() bool {
	_, err := FindPdfLatex()
	return err == nil
}

// ─────────────────────────────────────────────────────────────
// COMPILER
// ─────────────────────────────────────────────────────────────

// CompileResult holds the result of a LaTeX compilation attempt.
type CompileResult struct {
	Success  bool
	PDFPath  string
	ErrorLog string
}

// Compile runs pdflatex twice (for cross-references) on the given .tex file.
// It handles photo injection, sanitization, and returns structured results.
func Compile(texPath string, photoPath string) CompileResult {
	pdflatex, err := FindPdfLatex()
	if err != nil {
		return CompileResult{Success: false, ErrorLog: err.Error()}
	}

	// Ensure .tex extension
	if !strings.HasSuffix(texPath, ".tex") {
		texPath += ".tex"
	}

	// 1. Inject photo (or remove placeholder)
	if photoErr := injectPhoto(texPath, photoPath); photoErr != nil {
		return CompileResult{Success: false, ErrorLog: fmt.Sprintf("Photo injection error: %v", photoErr)}
	}

	// 2. Sanitize special characters
	if sanitizeErr := sanitize(texPath); sanitizeErr != nil {
		return CompileResult{Success: false, ErrorLog: fmt.Sprintf("Sanitization error: %v", sanitizeErr)}
	}

	workDir := filepath.Dir(texPath)
	texFile := filepath.Base(texPath)

	// 3. Run pdflatex twice for cross-references
	var lastLog string
	for pass := 0; pass < 2; pass++ {
		cmd := exec.Command(
			pdflatex,
			"-interaction=nonstopmode",
			"-halt-on-error",
			texFile,
		)
		cmd.Dir = workDir

		output, _ := cmd.CombinedOutput()
		lastLog = string(output)
	}

	// 4. Check if PDF was produced
	pdfPath := strings.TrimSuffix(texPath, ".tex") + ".pdf"
	if _, err := os.Stat(pdfPath); err == nil {
		return CompileResult{Success: true, PDFPath: pdfPath}
	}

	// Extract meaningful error from log file
	errorLog := extractLatexError(texPath, lastLog)
	return CompileResult{Success: false, ErrorLog: errorLog}
}

// extractLatexError reads the .log file and extracts the first meaningful error.
func extractLatexError(texPath string, fallback string) string {
	logPath := strings.TrimSuffix(texPath, ".tex") + ".log"
	data, err := os.ReadFile(logPath)
	if err != nil {
		return fallback
	}

	lines := strings.Split(string(data), "\n")
	var errors []string
	for _, line := range lines {
		if strings.HasPrefix(line, "!") || strings.Contains(line, "Error") {
			errors = append(errors, strings.TrimSpace(line))
			if len(errors) >= 5 {
				break
			}
		}
	}

	if len(errors) > 0 {
		return strings.Join(errors, "\n")
	}

	// Return last 800 chars of fallback
	if len(fallback) > 800 {
		return "..." + fallback[len(fallback)-800:]
	}
	return fallback
}

// ─────────────────────────────────────────────────────────────
// PHOTO INJECTION
// ─────────────────────────────────────────────────────────────

func injectPhoto(texPath string, photoPath string) error {
	if photoPath == "" || !fileExists(photoPath) {
		return removePlaceholder(texPath)
	}

	outDir := filepath.Dir(texPath)
	ext := strings.ToLower(filepath.Ext(photoPath))
	destName := "cv_photo_profile" + ext
	destPath := filepath.Join(outDir, destName)

	if err := copyFile(photoPath, destPath); err != nil {
		// If copy fails, just remove placeholder gracefully
		return removePlaceholder(texPath)
	}

	content, err := os.ReadFile(texPath)
	if err != nil {
		return fmt.Errorf("reading .tex file: %w", err)
	}

	newContent := strings.ReplaceAll(string(content), "%% PHOTO_PLACEHOLDER", `\cvphoto{`+destName+`}`)
	return os.WriteFile(texPath, []byte(newContent), 0644)
}

func removePlaceholder(texPath string) error {
	content, err := os.ReadFile(texPath)
	if err != nil {
		return fmt.Errorf("reading .tex file: %w", err)
	}
	newContent := strings.ReplaceAll(string(content), "%% PHOTO_PLACEHOLDER", "")
	return os.WriteFile(texPath, []byte(newContent), 0644)
}

// ─────────────────────────────────────────────────────────────
// SANITIZE
// ─────────────────────────────────────────────────────────────

// sanitize replaces problematic unicode characters and strips control characters.
func sanitize(texPath string) error {
	content, err := os.ReadFile(texPath)
	if err != nil {
		return fmt.Errorf("reading .tex file: %w", err)
	}

	s := string(content)
	replacements := map[string]string{
		"\u2013": "--",
		"\u2014": "---",
		"\u2019": "'",
		"\u2018": "'",
		"\u201C": "``",
		"\u201D": "''",
		"\u00A0": "~",
		"\u2022": "\\textbullet{}",
		"\u2026": "\\ldots{}",
	}
	for old, newVal := range replacements {
		s = strings.ReplaceAll(s, old, newVal)
	}

	// Strip remaining control characters (except tab and newline)
	re := regexp.MustCompile(`[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]`)
	s = re.ReplaceAllString(s, "")

	return os.WriteFile(texPath, []byte(s), 0644)
}

// ─────────────────────────────────────────────────────────────
// CLEANUP
// ─────────────────────────────────────────────────────────────

// Cleanup removes LaTeX auxiliary files after a successful build.
func Cleanup(texPath string) {
	base := strings.TrimSuffix(texPath, ".tex")
	for _, ext := range []string{".aux", ".log", ".out", ".toc", ".fls", ".fdb_latexmk", ".synctex.gz"} {
		os.Remove(base + ext)
	}
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}

// refreshWindowsPath reloads the PATH environment variable from the Windows registry.
// This ensures newly installed tools like MiKTeX are found without restarting the app.
func refreshWindowsPath() {
	// This is a best-effort operation; errors are silently ignored.
	// On non-Windows or if registry access fails, the existing PATH is used.
	_ = tryRefreshWindowsRegistryPath()
}
