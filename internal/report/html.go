package report

import (
	"bytes"
	"embed"
	"encoding/json"
	"fmt"
	"html/template"
	"time"

	"github.com/accelbench/accelbench/internal/database"
)

//go:embed templates/*.html
var templateFS embed.FS

var runTemplate *template.Template

func init() {
	funcMap := template.FuncMap{
		"formatFloat": formatFloat,
		"formatInt":   formatInt,
		"deref":       deref,
		"derefInt":    derefInt,
		"toJSON":      toJSON,
		"default":     defaultVal,
	}

	runTemplate = template.Must(template.New("run.html").Funcs(funcMap).ParseFS(templateFS, "templates/run.html"))
}

// ReportData holds all data needed to render a single run report.
type ReportData struct {
	Title        string
	ModelName    string
	ModelHfID    string
	InstanceType string
	Timestamp    string
	Config       ConfigData
	Metrics      *database.BenchmarkMetrics
	LatencyP50   []float64
	LatencyP90   []float64
	LatencyP99   []float64
}

// ConfigData holds configuration details for the report.
type ConfigData struct {
	Framework            string
	FrameworkVersion     string
	TensorParallel       int
	Quantization         string
	MaxModelLen          int
	Concurrency          int
	InputSequenceLength  int
	OutputSequenceLength int
	DatasetName          string
	RunType              string
}

// GenerateRunReport generates a self-contained HTML report for a single benchmark run.
func GenerateRunReport(run *database.BenchmarkRun, metrics *database.BenchmarkMetrics, details *database.RunExportDetails) ([]byte, error) {
	quant := "None"
	if run.Quantization != nil && *run.Quantization != "" {
		quant = *run.Quantization
	}

	data := ReportData{
		Title:        fmt.Sprintf("AccelBench Report - %s", details.ModelHfID),
		ModelName:    details.ModelHfID,
		ModelHfID:    details.ModelHfID,
		InstanceType: details.InstanceTypeName,
		Timestamp:    time.Now().Format("2006-01-02 15:04:05 MST"),
		Config: ConfigData{
			Framework:            run.Framework,
			FrameworkVersion:     run.FrameworkVersion,
			TensorParallel:       run.TensorParallelDegree,
			Quantization:         quant,
			MaxModelLen:          details.MaxModelLen,
			Concurrency:          run.Concurrency,
			InputSequenceLength:  run.InputSequenceLength,
			OutputSequenceLength: run.OutputSequenceLength,
			DatasetName:          run.DatasetName,
			RunType:              run.RunType,
		},
		Metrics: metrics,
		LatencyP50: []float64{
			deref(metrics.TTFTP50Ms),
			deref(metrics.E2ELatencyP50Ms),
			deref(metrics.ITLP50Ms),
		},
		LatencyP90: []float64{
			deref(metrics.TTFTP90Ms),
			deref(metrics.E2ELatencyP90Ms),
			deref(metrics.ITLP90Ms),
		},
		LatencyP99: []float64{
			deref(metrics.TTFTP99Ms),
			deref(metrics.E2ELatencyP99Ms),
			deref(metrics.ITLP99Ms),
		},
	}

	var buf bytes.Buffer
	if err := runTemplate.Execute(&buf, data); err != nil {
		return nil, fmt.Errorf("execute template: %w", err)
	}

	return buf.Bytes(), nil
}

// Template helper functions

func formatFloat(v *float64) string {
	if v == nil {
		return "-"
	}
	return fmt.Sprintf("%.1f", *v)
}

func formatInt(v *int) string {
	if v == nil {
		return "-"
	}
	return fmt.Sprintf("%d", *v)
}

func deref(v *float64) float64 {
	if v == nil {
		return 0
	}
	return *v
}

func derefInt(v *int) int {
	if v == nil {
		return 0
	}
	return *v
}

func toJSON(v interface{}) template.JS {
	b, _ := json.Marshal(v)
	return template.JS(b)
}

func defaultVal(def, val interface{}) interface{} {
	if val == nil || val == "" {
		return def
	}
	return val
}
