package manifest

// InferencePerfConfigParams holds values for rendering the inference-perf config YAML.
type InferencePerfConfigParams struct {
	// Server settings
	ModelHfID  string // HuggingFace ID (also used for tokenizer)
	ModelName  string // Model name for API requests (S3 URI when loading from S3; empty = use ModelHfID)
	TargetHost string
	TargetPort int

	// API settings
	APIType   string // "chat_completion" (default) or "completion"
	Streaming bool

	// Data distribution settings
	DatasetType  string // "synthetic" or "sharegpt"
	InputMean    int
	InputStdDev  int
	InputMin     int
	InputMax     int
	OutputMean   int
	OutputStdDev int
	OutputMin    int
	OutputMax    int

	// Load settings
	LoadType   string      // "constant" or "poisson"
	Stages     []LoadStage // rate and duration for each stage
	NumWorkers int
}

// LoadStage represents a load generation stage with rate and duration.
type LoadStage struct {
	Rate     int // requests per second
	Duration int // seconds
}

// RenderInferencePerfConfig renders the inference-perf configuration YAML.
func RenderInferencePerfConfig(params InferencePerfConfigParams) (string, error) {
	return renderTemplate("inferenceperf-config.yaml.tmpl", params)
}

// NewDefaultInferencePerfConfig creates a default config for a single-stage constant load.
// This provides sensible defaults for the "chatbot" scenario.
func NewDefaultInferencePerfConfig(modelHfID, targetHost string, targetPort int) InferencePerfConfigParams {
	return InferencePerfConfigParams{
		ModelHfID:    modelHfID,
		TargetHost:   targetHost,
		TargetPort:   targetPort,
		Streaming:    true,
		DatasetType:  "synthetic",
		InputMean:    256,
		InputStdDev:  64,
		InputMin:     128,
		InputMax:     512,
		OutputMean:   128,
		OutputStdDev: 32,
		OutputMin:    64,
		OutputMax:    256,
		LoadType:     "constant",
		Stages:       []LoadStage{{Rate: 5, Duration: 120}},
		NumWorkers:   4,
	}
}
