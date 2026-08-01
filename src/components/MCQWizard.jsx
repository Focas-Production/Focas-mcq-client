import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/client"
import { useAuth } from "../context/AuthContext"
import Spinner from "./Spinner"

// Absolute cap on questions per generation
const MAX_PER_GENERATION = 5

const GEN_MESSAGES = [
  "Sending your request to CA Guru AI...",
  "Reading the ICAI study material...",
  "Analyzing the chapter in depth...",
  "Crafting exam-style questions...",
  "Writing options and explanations...",
  "Reviewing question quality...",
  "Almost there — finalizing your quiz...",
]

function GeneratingPanel({ count }) {
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(
      () => setMsgIndex((i) => Math.min(i + 1, GEN_MESSAGES.length - 1)),
      4000
    )
    return () => clearInterval(t)
  }, [])

  return (
    <div className="py-10 sm:py-14 flex flex-col items-center text-center">
      {/* Animated gradient ring */}
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 animate-spin [animation-duration:1.2s]" />
        <div className="absolute inset-1.5 rounded-full bg-white grid place-items-center">
          <span className="text-2xl">🧠</span>
        </div>
      </div>

      <p className="font-semibold text-slate-900">
        Generating {count} question{count > 1 ? "s" : ""} for you
      </p>
      <p className="text-sm text-slate-500 mt-1.5 min-h-5 transition-all" key={msgIndex}>
        {GEN_MESSAGES[msgIndex]}
      </p>

      {/* Indeterminate shimmer bar */}
      <div className="w-56 h-1.5 bg-slate-100 rounded-full mt-6 overflow-hidden relative">
        <div className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 animate-shimmer" />
      </div>

      <p className="text-xs text-slate-400 mt-5">
        Our AI reads the actual ICAI material — this usually takes 30–60 seconds
      </p>
    </div>
  )
}

const pretty = (s) =>
  String(s || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())

const FALLBACK_DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "very-hard", label: "Very Hard" },
]

/**
 * Step-by-step wizard: level → subject → chapter → unit (only when the
 * chapter has units, skippable) → question type + difficulty + count.
 * Every option list is fetched from the backend.
 */
export default function MCQWizard({ isOnboarding = false }) {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  // Option lists from backend
  const [levels, setLevels] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [chapters, setChapters] = useState([])
  const [units, setUnits] = useState([])
  const [capabilities, setCapabilities] = useState(null)

  // Selections
  const [step, setStep] = useState(0)
  const [level, setLevel] = useState("")
  const [subject, setSubject] = useState("")
  const [chapter, setChapter] = useState("")
  const [unit, setUnit] = useState("")
  // Defaults: hard difficulty, 1 question
  const [questionType, setQuestionType] = useState("standard")
  const [difficulty, setDifficulty] = useState("hard")
  const [numQuestions, setNumQuestions] = useState(1)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [generating, setGenerating] = useState(false)
  const [usage, setUsage] = useState(null)

  useEffect(() => {
    api
      .get("/syllabus/levels")
      .then(({ data }) => setLevels(data.levels))
      .catch(() => setError("Failed to load levels from server"))
    api
      .get("/syllabus/capabilities")
      .then(({ data }) => setCapabilities(data.capabilities))
      .catch(() => setCapabilities(null))
    api
      .get("/mcq/usage")
      .then(({ data }) => setUsage(data.usage))
      .catch(() => setUsage(null))
  }, [])

  const difficulties = capabilities?.difficulties || FALLBACK_DIFFICULTIES
  const questionTypes = capabilities?.question_types || [
    { value: "standard", label: "General MCQ" },
  ]
  // Capped by the per-generation limit AND the student's remaining daily quota
  const maxQuestions = Math.max(
    Math.min(
      capabilities?.max_questions?.[questionType] || MAX_PER_GENERATION,
      MAX_PER_GENERATION,
      usage ? usage.remaining : MAX_PER_GENERATION
    ),
    1
  )
  const quotaExhausted = usage && usage.remaining <= 0

  // Steps: Unit step appears only when the chosen chapter has units
  const steps = ["Level", "Subject", "Chapter", ...(units.length > 0 ? ["Unit"] : []), "Questions"]
  const stepName = steps[Math.min(step, steps.length - 1)]

  const pickLevel = async (l) => {
    setLevel(l)
    setSubject("")
    setChapter("")
    setUnit("")
    setError("")
    setLoading(true)
    try {
      const { data } = await api.get("/syllabus/subjects", { params: { level: l } })
      setSubjects(data.subjects)
      setStep(1)
    } catch {
      setError("Failed to load subjects")
    } finally {
      setLoading(false)
    }
  }

  const pickSubject = async (s) => {
    setSubject(s)
    setChapter("")
    setUnit("")
    setError("")
    setLoading(true)
    try {
      const { data } = await api.get("/syllabus/chapters", {
        params: { level, subject: s },
      })
      setChapters(data.chapters)
      setStep(2)
    } catch {
      setError("Failed to load chapters")
    } finally {
      setLoading(false)
    }
  }

  const pickChapter = async (c) => {
    setChapter(c)
    setUnit("")
    setError("")
    setLoading(true)
    try {
      const { data } = await api.get("/syllabus/units", {
        params: { level, subject, chapter_name: c },
      })
      setUnits(data.units || [])
      // No units → jump straight to the questions step
      setStep(3)
    } catch {
      setUnits([])
      setStep(3)
    } finally {
      setLoading(false)
    }
  }

  const generate = async () => {
    setError("")
    setGenerating(true)
    try {
      if (isOnboarding) {
        const { data } = await api.put("/auth/onboarding", {
          level,
          subject,
          chapter,
          unit: unit || null,
        })
        updateUser(data.user)
      }

      const { data } = await api.post("/mcq/generate", {
        level,
        subject,
        chapter,
        unit: unit || null,
        difficulty,
        numQuestions,
        questionType,
      })

      sessionStorage.setItem(
        "activeQuiz",
        JSON.stringify({
          mcqs: data.mcqs,
          meta: { level, subject: pretty(subject), chapter, unit },
          timer: data.timer || { enabled: false, minutes: 0 },
        })
      )
      if (data.usage) setUsage(data.usage)
      navigate("/quiz")
    } catch (err) {
      const res = err.response?.data
      if (res?.usage) setUsage(res.usage)
      setError(res?.message || "MCQ generation failed. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  if (!levels) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
        {error ? (
          <p className="text-sm">{error}</p>
        ) : (
          <>
            <Spinner className="w-7 h-7 text-indigo-600" />
            <p className="text-sm">Loading syllabus...</p>
          </>
        )}
      </div>
    )
  }

  const optionButton = (key, label, isSelected, onClick, sub) => (
    <button
      key={key}
      onClick={onClick}
      disabled={loading}
      className={`p-3.5 sm:p-4 rounded-xl border text-left text-sm font-medium transition-all disabled:opacity-50 ${
        isSelected
          ? "border-indigo-500 bg-indigo-50/60 text-indigo-700 ring-4 ring-indigo-500/10"
          : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700"
      }`}
    >
      {label}
      {sub && <span className="ml-2 text-xs text-slate-400 font-normal">{sub}</span>}
    </button>
  )

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={`h-1 rounded-full transition-colors ${
                i <= step ? "bg-indigo-600" : "bg-slate-200"
              }`}
            />
            <p
              className={`mt-1.5 text-[11px] sm:text-xs truncate ${
                i === step
                  ? "text-indigo-600 font-semibold"
                  : i < step
                  ? "text-slate-500 font-medium"
                  : "text-slate-400"
              }`}
            >
              {s}
            </p>
          </div>
        ))}
      </div>

      {/* Daily quota */}
      {usage && (
        <div
          className={`mb-4 px-4 py-2.5 rounded-xl border text-sm flex items-center justify-between gap-3 ${
            quotaExhausted
              ? "bg-rose-50 border-rose-100 text-rose-700"
              : "bg-white border-slate-200 text-slate-600"
          }`}
        >
          <span>
            {quotaExhausted ? (
              <>Daily limit reached — come back tomorrow for more practice.</>
            ) : (
              <>
                <b className="text-slate-900">{usage.remaining}</b> of {usage.dailyLimit}{" "}
                questions left today
              </>
            )}
          </span>
          {!quotaExhausted && (
            <div className="hidden sm:block w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    (usage.remaining / Math.max(usage.dailyLimit, 1)) * 100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 relative">
        {/* Step-data loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[1px] rounded-2xl grid place-items-center">
            <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
              <Spinner className="w-5 h-5 text-indigo-600" />
              Loading...
            </div>
          </div>
        )}

        {generating ? (
          <GeneratingPanel count={Math.min(numQuestions, maxQuestions)} />
        ) : (
          <>
        {stepName === "Level" && (
          <>
            <h2 className="text-lg font-semibold mb-4">Select your level</h2>
            <div className="grid gap-3">
              {levels.map((l) => optionButton(l, l, level === l, () => pickLevel(l)))}
            </div>
          </>
        )}

        {stepName === "Subject" && (
          <>
            <h2 className="text-lg font-semibold mb-4">Select subject</h2>
            <div className="grid gap-3">
              {subjects.length === 0 ? (
                <p className="text-slate-400 text-sm">No subjects found for {level}</p>
              ) : (
                subjects.map((s) =>
                  optionButton(s, pretty(s), subject === s, () => pickSubject(s))
                )
              )}
            </div>
          </>
        )}

        {stepName === "Chapter" && (
          <>
            <h2 className="text-lg font-semibold mb-4">Select chapter</h2>
            <div className="grid gap-2 max-h-96 overflow-y-auto pr-1">
              {chapters.length === 0 ? (
                <p className="text-slate-400 text-sm">No chapters found</p>
              ) : (
                chapters.map((c) =>
                  optionButton(c, c, chapter === c, () => pickChapter(c))
                )
              )}
            </div>
          </>
        )}

        {stepName === "Unit" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Select unit</h2>
              <button
                onClick={() => {
                  setUnit("")
                  setStep(4)
                }}
                className="text-sm text-slate-500 hover:text-indigo-600 font-medium"
              >
                Skip →
              </button>
            </div>
            <div className="grid gap-2 max-h-96 overflow-y-auto pr-1">
              {units.map((u) =>
                optionButton(
                  u.unit_number ?? u.unit_name,
                  u.unit_name,
                  unit === u.unit_name,
                  () => {
                    setUnit(u.unit_name)
                    setStep(4)
                  },
                  u.unit_number ? `Unit ${u.unit_number}` : null
                )
              )}
            </div>
          </>
        )}

        {stepName === "Questions" && (
          <>
            <h2 className="text-lg font-semibold mb-1">Almost there!</h2>
            <p className="text-sm text-slate-500 mb-4">
              {pretty(subject)} · {chapter}
              {unit ? ` · ${unit}` : ""}
            </p>

            {questionTypes.length > 1 && (
              <>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Question type
                </label>
                <div className="flex gap-2 mb-5">
                  {questionTypes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => {
                        setQuestionType(t.value)
                        const max = Math.min(
                          capabilities?.max_questions?.[t.value] || MAX_PER_GENERATION,
                          MAX_PER_GENERATION
                        )
                        if (numQuestions > max) setNumQuestions(max)
                      }}
                      className={`flex-1 h-10 rounded-xl border text-sm font-medium transition-all ${
                        questionType === t.value
                          ? "border-indigo-500 bg-indigo-50/60 text-indigo-700 ring-4 ring-indigo-500/10"
                          : "border-slate-200 hover:border-indigo-300 text-slate-600"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            <label className="block text-sm font-medium text-slate-700 mb-2">
              Difficulty
            </label>
            <div className="flex gap-2 mb-5 flex-wrap">
              {difficulties.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`flex-1 min-w-24 h-10 rounded-xl border text-sm font-medium transition-all ${
                    difficulty === d.value
                      ? "border-indigo-500 bg-indigo-50/60 text-indigo-700 ring-4 ring-indigo-500/10"
                      : "border-slate-200 hover:border-indigo-300 text-slate-600"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-slate-700 mb-2">
              Number of questions: <b>{numQuestions}</b>
              <span className="text-xs text-slate-400 ml-2">(max {maxQuestions})</span>
            </label>
            <input
              type="range"
              min={1}
              max={maxQuestions}
              value={Math.min(numQuestions, maxQuestions)}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              className="w-full accent-indigo-600 mb-6"
            />

            <button
              onClick={generate}
              disabled={generating || quotaExhausted}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[15px] font-medium hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {quotaExhausted ? (
                "Daily limit reached"
              ) : (
                <>
                  Generate {Math.min(numQuestions, maxQuestions)} MCQ
                  {Math.min(numQuestions, maxQuestions) > 1 ? "s" : ""} ✨
                </>
              )}
            </button>
          </>
        )}
          </>
        )}
      </div>

      {step > 0 && !generating && (
        <button
          onClick={() => {
            // When leaving the Questions step and the chapter has no units,
            // go back to Chapter (index 2), not a phantom Unit step
            if (stepName === "Questions" && units.length === 0) setStep(2)
            else setStep(step - 1)
          }}
          className="mt-4 text-sm text-slate-500 hover:text-indigo-600 font-medium"
        >
          ← Back
        </button>
      )}
    </div>
  )
}
