import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/client"
import PageShell from "../components/PageShell"
import Spinner from "../components/Spinner"

const LETTERS = ["A", "B", "C", "D", "E", "F"]

// Options from the RAG API often arrive as "A: some text" — strip the
// letter prefix for display since we render our own letter badge
const optionLabel = (opt) => String(opt).replace(/^[A-F]\s*[:).]\s*/i, "")

const mmss = (secs) => {
  const m = Math.floor(Math.max(secs, 0) / 60)
  const s = Math.max(secs, 0) % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export default function Quiz() {
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [answers, setAnswers] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(null)
  const startTime = useRef(Date.now())
  const submitRef = useRef(null)

  useEffect(() => {
    const stored = sessionStorage.getItem("activeQuiz")
    if (!stored) {
      navigate("/generate")
      return
    }
    setQuiz(JSON.parse(stored))
  }, [navigate])

  const mcqs = quiz?.mcqs || []
  const meta = quiz?.meta
  const timerCfg = quiz?.timer
  const mcq = mcqs[index]
  const finished = quiz && index >= mcqs.length
  const timerOn = Boolean(timerCfg?.enabled && timerCfg?.minutes > 0)

  const submit = async (viaTimeout = false) => {
    // Guard: only the timer passes `true`; anything else (e.g. a click event
    // accidentally forwarded) must never count as a timeout
    viaTimeout = viaTimeout === true
    if (!mcq || submitting) return
    if (selected === null && !viaTimeout) return
    setSubmitting(true)
    try {
      const { data } = await api.post("/mcq/submit", {
        mcqId: mcq.mcqId,
        // Timed out with nothing selected — recorded as an unanswered attempt
        userAnswer: selected === null ? "-" : LETTERS[selected],
        optionText: selected === null ? null : mcq.options[selected],
        timeSpent: Math.round((Date.now() - startTime.current) / 1000),
        timedOut: viaTimeout,
      })
      setFeedback({ ...data, timedOut: viaTimeout })
      setAnswers((prev) => [...prev, { isCorrect: data.isCorrect }])
    } catch (err) {
      // No response object means the request never reached the server
      const msg = err.response
        ? err.response.data?.message || "Failed to submit answer"
        : "Couldn't reach the server. Check your connection and tap Submit again."
      setFeedback({ error: msg })
    } finally {
      setSubmitting(false)
    }
  }
  submitRef.current = submit

  // Per-question countdown — restarts on each question, stops once answered
  useEffect(() => {
    if (!quiz || !timerOn || finished || feedback) {
      setSecondsLeft(null)
      return
    }
    setSecondsLeft(timerCfg.minutes * 60)
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s === null) return s
        if (s <= 1) {
          clearInterval(id)
          submitRef.current?.(true)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, index, feedback, finished, timerOn])

  if (!quiz) return null

  const next = () => {
    setSelected(null)
    setFeedback(null)
    setIndex(index + 1)
    startTime.current = Date.now()
  }

  if (finished) {
    const correct = answers.filter((a) => a.isCorrect).length
    const pct = answers.length ? Math.round((correct / answers.length) * 100) : 0
    sessionStorage.removeItem("activeQuiz")
    return (
      <PageShell>
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center">
            <div
              className={`w-20 h-20 mx-auto rounded-full grid place-items-center text-2xl font-bold ${
                pct >= 70
                  ? "bg-emerald-50 text-emerald-600"
                  : pct >= 40
                  ? "bg-amber-50 text-amber-600"
                  : "bg-rose-50 text-rose-500"
              }`}
            >
              {pct}%
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 mt-5">
              Session complete
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {correct} of {answers.length} correct · {meta.chapter}
            </p>
            <div className="grid gap-2.5 mt-7">
              <button
                onClick={() => navigate("/generate")}
                className="h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/25 transition-all"
              >
                Practice again
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="h-11 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Go to dashboard
              </button>
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto">
        {/* Progress header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-xs sm:text-sm text-slate-500 truncate">
            {meta.subject} · {meta.chapter}
          </p>
          <div className="flex items-center gap-3 shrink-0">
            {/* Countdown — only rendered when admin has enabled the timer */}
            {timerOn && secondsLeft !== null && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-xs font-semibold tabular-nums transition-colors ${
                  secondsLeft <= 30
                    ? "bg-rose-50 text-rose-600 animate-pulse"
                    : secondsLeft <= 60
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {mmss(secondsLeft)}
              </span>
            )}
            <p className="text-xs sm:text-sm font-medium text-slate-700">
              {index + 1} <span className="text-slate-400">/ {mcqs.length}</span>
            </p>
          </div>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${((index + 1) / mcqs.length) * 100}%` }}
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7">
          {mcq.caseScenarioNarrative && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50/70 border border-amber-100 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              <p className="font-semibold text-amber-800 mb-1.5 text-xs uppercase tracking-wide">
                Case scenario
              </p>
              {mcq.caseScenarioNarrative}
            </div>
          )}

          <p className="font-medium text-slate-900 text-[15px] sm:text-base leading-relaxed mb-6 whitespace-pre-line">
            {mcq.question}
          </p>

          <div className="grid gap-2.5 mb-6">
            {mcq.options.map((opt, i) => {
              let style = "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
              let badge = "bg-slate-100 text-slate-500"
              if (feedback && !feedback.error) {
                const correctLetter = String(feedback.correctAnswer || "").toUpperCase().trim()
                const isThisCorrect =
                  correctLetter === LETTERS[i] ||
                  correctLetter.startsWith(LETTERS[i] + ")") ||
                  correctLetter === String(opt).toUpperCase().trim()
                if (isThisCorrect) {
                  style = "border-emerald-400 bg-emerald-50/60"
                  badge = "bg-emerald-500 text-white"
                } else if (selected === i) {
                  style = "border-rose-300 bg-rose-50/60"
                  badge = "bg-rose-400 text-white"
                } else {
                  style = "border-slate-200 opacity-50"
                }
              } else if (selected === i) {
                style = "border-indigo-500 bg-indigo-50/60 ring-4 ring-indigo-500/10"
                badge = "bg-indigo-600 text-white"
              }
              return (
                <button
                  key={i}
                  disabled={!!feedback && !feedback.error}
                  onClick={() => setSelected(i)}
                  className={`p-3.5 sm:p-4 rounded-xl border text-left text-sm flex items-start gap-3 transition-all ${style}`}
                >
                  <span
                    className={`shrink-0 w-6 h-6 rounded-md grid place-items-center text-xs font-bold transition-colors ${badge}`}
                  >
                    {LETTERS[i]}
                  </span>
                  <span className="leading-relaxed pt-0.5">{optionLabel(opt)}</span>
                </button>
              )
            })}
          </div>

          {feedback?.error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
              {feedback.error}
            </div>
          )}

          {feedback && !feedback.error && (
            <div
              className={`mb-5 p-4 rounded-xl border ${
                feedback.isCorrect
                  ? "bg-emerald-50/70 border-emerald-100"
                  : "bg-rose-50/70 border-rose-100"
              }`}
            >
              <p
                className={`text-sm font-semibold mb-1 ${
                  feedback.isCorrect ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {feedback.isCorrect
                  ? "Correct"
                  : feedback.timedOut && selected === null
                  ? `Time's up — answer is ${feedback.correctAnswer}`
                  : `Incorrect — answer is ${feedback.correctAnswer}`}
              </p>
              {feedback.explanation && (
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {feedback.explanation}
                </p>
              )}
            </div>
          )}

          {!feedback || feedback.error ? (
            <button
              onClick={() => submit(false)}
              disabled={selected === null || submitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[15px] font-medium hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
            >
              {submitting && <Spinner className="w-4.5 h-4.5 text-white" />}
              {submitting ? "Checking your answer..." : "Submit answer"}
            </button>
          ) : (
            <button
              onClick={next}
              className="w-full h-12 rounded-xl bg-slate-900 text-white text-[15px] font-medium hover:bg-slate-800 transition-colors"
            >
              {index + 1 === mcqs.length ? "Finish session" : "Next question"}
            </button>
          )}
        </div>
      </div>
    </PageShell>
  )
}
