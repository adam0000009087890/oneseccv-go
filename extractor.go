package main

import (
	"archive/zip"
	"bytes"
	"encoding/xml"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/ledongthuc/pdf"
)

// ExtractText extracts plain text from a PDF, DOCX, or TXT file.
// Returns a trimmed string or an error with context.
func ExtractText(filePath string) (string, error) {
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return "", fmt.Errorf("file not found: %s", filePath)
	}

	ext := strings.ToLower(filepath.Ext(filePath))
	switch ext {
	case ".pdf":
		return extractPDF(filePath)
	case ".docx":
		return extractDOCX(filePath)
	case ".txt":
		return extractTXT(filePath)
	default:
		return "", fmt.Errorf("unsupported format '%s' — use PDF, DOCX or TXT", ext)
	}
}

// ─────────────────────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────────────────────

func extractPDF(filePath string) (string, error) {
	f, r, err := pdf.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open PDF: %w", err)
	}
	defer f.Close()

	var sb strings.Builder
	totalPages := r.NumPage()

	if totalPages == 0 {
		return "", fmt.Errorf("PDF file is empty or unreadable")
	}

	for i := 1; i <= totalPages; i++ {
		page := r.Page(i)
		if page.V.IsNull() {
			continue
		}
		text, err := page.GetPlainText(nil)
		if err != nil {
			// Skip unreadable pages instead of failing entirely
			continue
		}
		sb.WriteString(text)
		sb.WriteString("\n")
	}

	result := strings.TrimSpace(sb.String())
	if result == "" {
		return "", fmt.Errorf("PDF contains no extractable text (scanned PDF?)")
	}
	return result, nil
}

// ─────────────────────────────────────────────────────────────
// DOCX
// ─────────────────────────────────────────────────────────────

// wordXML is used to unmarshal the word/document.xml inside a DOCX zip.
type wordXML struct {
	XMLName xml.Name `xml:"document"`
	Body    wordBody `xml:"body"`
}

type wordBody struct {
	Paragraphs []wordParagraph `xml:"p"`
}

type wordParagraph struct {
	Runs []wordRun `xml:"r"`
}

type wordRun struct {
	Text string `xml:"t"`
}

func extractDOCX(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to read DOCX file: %w", err)
	}

	r, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", fmt.Errorf("DOCX file is corrupted or invalid: %w", err)
	}

	for _, f := range r.File {
		if f.Name != "word/document.xml" {
			continue
		}

		rc, err := f.Open()
		if err != nil {
			return "", fmt.Errorf("failed to open word/document.xml: %w", err)
		}
		defer rc.Close()

		var doc wordXML
		decoder := xml.NewDecoder(rc)
		if err := decoder.Decode(&doc); err != nil {
			// Fallback: strip XML tags manually
			rawBytes, _ := os.ReadFile(filePath)
			return stripXMLTags(string(rawBytes)), nil
		}

		var sb strings.Builder
		for _, para := range doc.Body.Paragraphs {
			var line strings.Builder
			for _, run := range para.Runs {
				line.WriteString(run.Text)
			}
			if text := strings.TrimSpace(line.String()); text != "" {
				sb.WriteString(text)
				sb.WriteString("\n")
			}
		}

		result := strings.TrimSpace(sb.String())
		if result == "" {
			return "", fmt.Errorf("DOCX file appears to be empty")
		}
		return result, nil
	}

	return "", fmt.Errorf("invalid DOCX file: word/document.xml not found")
}

func stripXMLTags(s string) string {
	re := regexp.MustCompile(`<[^>]+>`)
	return strings.TrimSpace(re.ReplaceAllString(s, " "))
}

// ─────────────────────────────────────────────────────────────
// TXT
// ─────────────────────────────────────────────────────────────

func extractTXT(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to read text file: %w", err)
	}
	result := strings.TrimSpace(string(data))
	if result == "" {
		return "", fmt.Errorf("text file is empty")
	}
	return result, nil
}
