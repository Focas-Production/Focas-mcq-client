import { useEffect, useState } from "react"
import api from "../api/client"
import PageShell from "../components/PageShell"
import Spinner from "../components/Spinner"

/**
 * ⚠️ RESULTS SECTION HIDDEN FOR NOW
 * The full results page is kept below as `ResultsFull`.
 * To re-enable it:
 *   1. Change the export at the bottom to: export default ResultsFull
 *   2. Uncomment the "Results" item in src/components/Navbar.jsx
 */
function ResultsHidden() {
  return (
    <PageShell title="My results">
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
        Results section is coming soon.
      </div>
    </PageShell>
  )
}

// eslint-disable-next-line no-unused-vars
function ResultsFull() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api
      .get("/mcq/results", { params: { page, limit: 10 } })
      .then(({ data }) => setData(data))
      .catch(() => setData({ results: [], total: 0, pages: 0 }))
  }, [page])

  return (
    <PageShell title="My results" subtitle="Review every question you've attempted">
      {!data ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-14 flex flex-col items-center gap-3 text-slate-500 text-sm">
          <Spinner className="w-6 h-6 text-indigo-600" />
          Loading your results...
        </div>
      ) : data.results.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
          No attempts yet — your submitted answers will appear here.
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {data.results.map((r) => (
              <div
                key={r.evaluationId}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpanded(expanded === r.evaluationId ? null : r.evaluationId)
                  }
                  className="w-full p-4 flex items-center gap-3.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span
                    className={`shrink-0 w-9 h-9 rounded-full grid place-items-center text-sm font-bold ${
                      r.isCorrect
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-500"
                    }`}
                  >
                    {r.isCorrect ? "✓" : "✗"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {r.question || `Question #${r.questionNumber ?? ""}`}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {r.chapter}
                      {r.unit ? ` · ${r.unit}` : ""} ·{" "}
                      {new Date(r.submittedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      expanded === r.evaluationId ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {expanded === r.evaluationId && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-sm space-y-2.5">
                    <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2">
                      <p>
                        <span className="text-slate-500">Your answer: </span>
                        <b className={r.isCorrect ? "text-emerald-600" : "text-rose-500"}>
                          {r.userAnswer}
                        </b>
                      </p>
                      {!r.isCorrect && (
                        <p>
                          <span className="text-slate-500">Correct answer: </span>
                          <b className="text-emerald-600">{r.correctAnswer}</b>
                        </p>
                      )}
                    </div>
                    {r.explanation && (
                      <p className="text-slate-600 bg-slate-50 rounded-xl p-3.5 leading-relaxed whitespace-pre-line">
                        {r.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-9 px-3.5 rounded-lg border border-slate-300 bg-white text-sm font-medium disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                {page} / {data.pages}
              </span>
              <button
                disabled={page >= data.pages}
                onClick={() => setPage(page + 1)}
                className="h-9 px-3.5 rounded-lg border border-slate-300 bg-white text-sm font-medium disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </PageShell>
  )
}

// Swap to `ResultsFull` to bring the results page back
export default ResultsHidden
