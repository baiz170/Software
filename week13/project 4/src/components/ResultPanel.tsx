import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Sparkles, Loader2 } from "lucide-react";
import type { AvailabilityResult } from "@/lib/availability";
import { explainAvailability } from "@/lib/explain";

interface ResultPanelProps {
  result: AvailabilityResult | null;
  roomName?: string;
}

export default function ResultPanel({ result, roomName }: ResultPanelProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setExplanation(null);
    setExplainError(null);
  }, [result]);

  const handleExplain = () => {
    if (!result) return;

    if (explanation !== null) {
      setExplanation(null);
      return;
    }

    setLoading(true);
    setExplainError(null);

    try {
      const out = explainAvailability(result, { roomName });
      if (out.ok) {
        setExplanation(out.text);
      } else {
        setExplainError(out.error);
        setExplanation(null);
      }
    } catch {
      setExplainError("An unexpected error occurred while generating the explanation.");
      setExplanation(null);
    } finally {
      setLoading(false);
    }
  };

  const explainButton = (
    <button
      type="button"
      onClick={handleExplain}
      disabled={loading}
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5 text-blue-500" />
      )}
      {explanation ? "Hide explanation" : "Explain availability"}
    </button>
  );

  if (!result) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center"
        aria-live="polite"
      >
        <p className="text-sm text-slate-400">
          Enter a start and end time, then check availability.
        </p>
      </div>
    );
  }

  if (result.available) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-600" />
          <div className="w-full">
            <p className="font-semibold text-emerald-900">Available</p>
            <p className="mt-0.5 text-sm text-emerald-700">
              This time slot is open and does not conflict with any existing
              booking. No reservation has been made — this tool only checks
              availability.
            </p>
            {explainButton}
            {explanation && (
              <div className="mt-2 rounded-lg bg-white/60 px-3 py-2 text-sm text-emerald-800">
                {explanation}
              </div>
            )}
            {explainError && (
              <p className="mt-2 text-xs text-rose-600">{explainError}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4"
    >
      <div className="flex items-start gap-3">
        <XCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-rose-600" />
        <div className="w-full">
          <p className="font-semibold text-rose-900">Unavailable</p>
          <p className="mt-0.5 text-sm text-rose-700">{result.reason}</p>
          {explainButton}
          {explanation && (
            <div className="mt-2 rounded-lg bg-white/60 px-3 py-2 text-sm text-rose-800">
              {explanation}
            </div>
          )}
          {explainError && (
            <p className="mt-2 text-xs text-rose-600">{explainError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
