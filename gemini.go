package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type geminiRequest struct {
	Contents []geminiContent `json:"contents"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
		FinishReason string `json:"finishReason"`
	} `json:"candidates"`
	Error *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
		Status  string `json:"status"`
	} `json:"error"`
}

// ─────────────────────────────────────────────────────────────
// CLIENT
// ─────────────────────────────────────────────────────────────

type GeminiClient struct {
	apiKey     string
	httpClient *http.Client
	baseURL    string
}

func NewGeminiClient(apiKey string) *GeminiClient {
	return &GeminiClient{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 120 * time.Second,
		},
		baseURL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
	}
}

// GenerateLatex calls the Gemini API and extracts LaTeX code from the response.
// It automatically retries on rate-limit (429) errors.
func (g *GeminiClient) GenerateLatex(prompt string) (string, error) {
	if g.apiKey == "" {
		return "", fmt.Errorf("API key missing — configure it in the Settings tab")
	}

	payload := geminiRequest{
		Contents: []geminiContent{
			{Parts: []geminiPart{{Text: prompt}}},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("failed to serialize request: %w", err)
	}

	url := fmt.Sprintf("%s?key=%s", g.baseURL, g.apiKey)

	const maxRetries = 5
	for attempt := 1; attempt <= maxRetries; attempt++ {
		raw, err := g.doRequest(url, body)
		if err != nil {
			// Rate limit: wait and retry
			if strings.Contains(err.Error(), "429") || strings.Contains(err.Error(), "RESOURCE_EXHAUSTED") {
				wait := time.Duration(35+attempt*10) * time.Second
				time.Sleep(wait)
				continue
			}
			return "", err
		}
		return extractLatexBlock(raw), nil
	}

	return "", fmt.Errorf("rate limit exceeded after %d attempts — please try again in a few minutes", maxRetries)
}

func (g *GeminiClient) doRequest(url string, body []byte) (string, error) {
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to create HTTP request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("network error calling AI engine: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read AI engine response: %w", err)
	}

	if resp.StatusCode == 429 {
		return "", fmt.Errorf("429 RESOURCE_EXHAUSTED")
	}

	if resp.StatusCode != 200 {
		var apiErr geminiResponse
		if json.Unmarshal(respBody, &apiErr) == nil && apiErr.Error != nil {
			return "", fmt.Errorf("AI engine API error [%d %s]: %s", apiErr.Error.Code, apiErr.Error.Status, apiErr.Error.Message)
		}
		return "", fmt.Errorf("AI engine HTTP error %d: %s", resp.StatusCode, string(respBody))
	}

	var result geminiResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("failed to deserialize AI engine response: %w", err)
	}

	if len(result.Candidates) == 0 || len(result.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty AI engine response — model returned no candidates")
	}

	return result.Candidates[0].Content.Parts[0].Text, nil
}

// extractLatexBlock extracts a clean LaTeX document from a raw Gemini response.
// It strips markdown code fences and finds the documentclass…end{document} block.
func extractLatexBlock(raw string) string {
	// Strip markdown fences
	raw = strings.ReplaceAll(raw, "```latex", "")
	raw = strings.ReplaceAll(raw, "```tex", "")
	raw = strings.ReplaceAll(raw, "```", "")

	// Try to extract a proper LaTeX document
	re := regexp.MustCompile(`(?s)(\\documentclass.*?\\end\{document\})`)
	if match := re.FindString(raw); match != "" {
		return strings.TrimSpace(match)
	}

	// Fallback: return trimmed raw
	return strings.TrimSpace(raw)
}
