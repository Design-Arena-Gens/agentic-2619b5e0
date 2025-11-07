'use client';

import { useEffect, useMemo, useState } from "react";
import {
  BigramModel,
  exportModel,
  generateText,
  trainBigramModel,
} from "@/lib/charBigram";

type ModelInfo = {
  model: BigramModel;
  perplexity: number;
  totalTransitions: number;
};

const DEFAULT_CORPUS = `Transformers are attention-based neural networks that model relationships between tokens
without relying on recurrence or convolutions. Every token attends to every other token,
unlocking rich contextual representations that power generative models like ChatGPT.
---
Large language models emerge by stacking transformer blocks, scaling dataset sizes,
and training with next-token prediction. This simple objective leads models to learn grammar,
facts, reasoning patterns, and even coding abilities.`;

const DEFAULT_LENGTH = 220;

const DEFAULT_TEMPERATURE = 0.9;

const formatNumber = (value: number) =>
  Intl.NumberFormat("en", {
    maximumFractionDigits: value >= 10 ? 0 : 2,
  }).format(value);

export default function Home() {
  const [trainingText, setTrainingText] = useState(DEFAULT_CORPUS);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sampleLength, setSampleLength] = useState(DEFAULT_LENGTH);
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [output, setOutput] = useState("");

  const tokenCount = useMemo(() => {
    if (!modelInfo) return 0;
    return modelInfo.model.vocab.length;
  }, [modelInfo]);

  const handleTrain = () => {
    setIsTraining(true);
    try {
      const result = trainBigramModel(trainingText, 0.75);
      setModelInfo(result);
      setError(null);
    } catch (trainingError) {
      const message =
        trainingError instanceof Error
          ? trainingError.message
          : "Unable to train model with the provided text.";
      setError(message);
      setModelInfo(null);
      setOutput("");
    } finally {
      setIsTraining(false);
    }
  };

  const handleGenerate = () => {
    if (!modelInfo) {
      setOutput("");
      return;
    }
    const generated = generateText(modelInfo.model, sampleLength, temperature);
    setOutput(generated);
  };

  const handleExport = () => {
    if (!modelInfo) return;
    const fileContent = exportModel(modelInfo.model);
    const blob = new Blob([fileContent], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "char-bigram-llm.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    handleTrain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!modelInfo) return;
    const generated = generateText(modelInfo.model, sampleLength, temperature);
    setOutput(generated);
  }, [modelInfo, sampleLength, temperature]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12 md:py-16 lg:py-20">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-6">
            <h1 className="text-3xl font-semibold md:text-4xl">Char-Bigram LLM Lab</h1>
            <button
              type="button"
              onClick={handleExport}
              disabled={!modelInfo}
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-500"
            >
              Export Model
            </button>
          </div>
          <p className="max-w-3xl text-base text-zinc-300 md:text-lg">
            Train a lightweight character-level large language model using a simple
            bigram architecture. Paste your own corpus, train, and sample fresh generations
            with adjustable temperature.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Training Corpus</h2>
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                {trainingText.length} chars
              </span>
            </div>
            <textarea
              className="min-h-[220px] flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-sm text-zinc-200 outline-none ring-[1.5px] ring-transparent transition focus-visible:ring-zinc-700"
              value={trainingText}
              onChange={(event) => setTrainingText(event.target.value)}
              spellCheck={false}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTrain}
                disabled={isTraining}
                className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {isTraining ? "Training…" : "Train Model"}
              </button>
              <button
                type="button"
                onClick={() => setTrainingText(DEFAULT_CORPUS)}
                className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-900"
              >
                Reset Corpus
              </button>
              <button
                type="button"
                onClick={() =>
                  setTrainingText(
                    "In the beginning, there was only math and the whisper of tokens across the lattice.",
                  )
                }
                className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-900"
              >
                Minimal Prompt
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6">
            <h2 className="text-lg font-medium">Model Diagnostics</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm text-zinc-300">
              <div className="rounded-xl border border-zinc-900 bg-black/50 px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Perplexity</dt>
                <dd className="text-xl font-semibold text-zinc-100">
                  {modelInfo ? formatNumber(modelInfo.perplexity) : "—"}
                </dd>
              </div>
              <div className="rounded-xl border border-zinc-900 bg-black/50 px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Vocabulary Size
                </dt>
                <dd className="text-xl font-semibold text-zinc-100">
                  {modelInfo ? tokenCount : "—"}
                </dd>
              </div>
              <div className="rounded-xl border border-zinc-900 bg-black/50 px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Transitions Learned
                </dt>
                <dd className="text-xl font-semibold text-zinc-100">
                  {modelInfo ? formatNumber(modelInfo.totalTransitions) : "—"}
                </dd>
              </div>
              <div className="rounded-xl border border-zinc-900 bg-black/50 px-4 py-3">
                <dt className="text-xs uppercase tracking-wide text-zinc-500">
                  Temperature
                </dt>
                <dd className="text-xl font-semibold text-zinc-100">
                  {temperature.toFixed(2)}
                </dd>
              </div>
            </dl>
            <div className="mt-2 flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm text-zinc-300">
                <span className="flex items-center justify-between">
                  Generation Length
                  <span className="font-mono text-xs text-zinc-500">{sampleLength}</span>
                </span>
                <input
                  type="range"
                  min={30}
                  max={400}
                  value={sampleLength}
                  onChange={(event) => setSampleLength(Number(event.target.value))}
                  className="accent-zinc-50"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-zinc-300">
                <span className="flex items-center justify-between">
                  Temperature
                  <span className="font-mono text-xs text-zinc-500">
                    {temperature.toFixed(2)}
                  </span>
                </span>
                <input
                  type="range"
                  min={0.3}
                  max={1.5}
                  step={0.05}
                  value={temperature}
                  onChange={(event) => setTemperature(Number(event.target.value))}
                  className="accent-zinc-50"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!modelInfo}
                  className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
                >
                  Generate Text
                </button>
                <button
                  type="button"
                  onClick={() => setOutput("")}
                  className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-900"
                >
                  Clear Output
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-900 bg-black/40 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Generated Sample</h2>
            <button
              type="button"
              onClick={() => {
                if (!output) return;
                navigator.clipboard.writeText(output).catch(() => {});
              }}
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs uppercase tracking-wide text-zinc-200 transition hover:bg-zinc-900"
            >
              Copy
            </button>
          </div>
          <pre className="min-h-[220px] whitespace-pre-wrap rounded-xl border border-zinc-900 bg-zinc-950/80 p-4 font-mono text-sm leading-relaxed text-zinc-200">
            {output || "Run a generation to see your model in action."}
          </pre>
        </section>
      </main>
    </div>
  );
}
