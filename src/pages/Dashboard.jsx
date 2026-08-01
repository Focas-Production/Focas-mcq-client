import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "../api/client"
import PageShell from "../components/PageShell"
import { useAuth } from "../context/AuthContext"

const pretty = (s) =>
  String(s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

function StatCard({ label, value, icon, tone, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
      <div className={`w-9 h-9 rounded-xl grid place-items-center mb-3 ${tone}`}>
        {icon}
      </div>
      <p className="text-[13px] text-slate-500">{label}</p>
      {loading ? (
        <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse mt-1.5" />
      ) : (
        <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mt-1">
          {value}
        </p>
      )}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {[0, 1, 2].map((i) => (
        <div key={i} className="p-4 sm:px-5 flex items-center gap-4 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-100 rounded w-2/3" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
          <div className="h-5 w-12 bg-slate-100 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function ScoreBadge({ value }) {
  const tone =
    value >= 70
      ? "bg-emerald-50 text-emerald-700"
      : value >= 40
      ? "bg-amber-50 text-amber-700"
      : "bg-rose-50 text-rose-600"
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tone}`}>
      {value}%
    </span>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [dash, setDash] = useState(null)
  const [board, setBoard] = useState(null)
  const [tab, setTab] = useState("progress")

  useEffect(() => {
    api.get("/mcq/dashboard").then(({ data }) => setDash(data)).catch(() => {})
    api.get("/mcq/leaderboard").then(({ data }) => setBoard(data)).catch(() => {})
  }, [])

  const summary = dash?.summary

  return (
    <PageShell
      title={`Hello, ${user?.name?.split(" ")[0] || "Student"}`}
      action={
        <Link
          to="/generate"
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/25 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
          </svg>
          Start Quiz
        </Link>
      }
    >
      {/* Daily quota */}
      {dash?.usage && (
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 mb-4 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            Today's quota:{" "}
            <b className="text-slate-900">{dash.usage.usedToday}</b> of{" "}
            {dash.usage.dailyLimit} generated
            {dash.usage.remaining > 0 ? (
              <span className="text-slate-400"> · {dash.usage.remaining} left</span>
            ) : (
              <span className="text-rose-500"> · limit reached</span>
            )}
          </p>
          <div className="w-24 sm:w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
              style={{
                width: `${Math.min(
                  100,
                  (dash.usage.usedToday / Math.max(dash.usage.dailyLimit, 1)) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <StatCard
          label="Questions generated"
          value={summary?.totalGenerated ?? 0}
          loading={!dash}
          tone="bg-violet-50 text-violet-600"
          icon={
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          }
        />
        <StatCard
          label="Questions attempted"
          value={summary?.totalAttempted ?? 0}
          loading={!dash}
          tone="bg-indigo-50 text-indigo-600"
          icon={
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M9 8h6m-8.25 12h10.5A2.25 2.25 0 0019.5 17.75V6.25A2.25 2.25 0 0017.25 4H6.75A2.25 2.25 0 004.5 6.25v11.5A2.25 2.25 0 006.75 20z" />
            </svg>
          }
        />
        <StatCard
          label="Correct answers"
          value={summary?.totalCorrect ?? 0}
          loading={!dash}
          tone="bg-emerald-50 text-emerald-600"
          icon={
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Accuracy"
          value={`${summary?.accuracy ?? 0}%`}
          loading={!dash}
          tone="bg-sky-50 text-sky-600"
          icon={
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />
        <StatCard
          label="Leaderboard rank"
          value={board?.me ? `#${board.me.rank}` : "—"}
          loading={!board}
          tone="bg-amber-50 text-amber-600"
          icon={
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
            </svg>
          }
        />
      </div>

      {/* Tabs */}
      <div className="inline-flex p-1 rounded-xl bg-slate-100 mb-4">
        {[
          { key: "progress", label: "My progress" },
          { key: "leaderboard", label: "Leaderboard" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 h-9 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "progress" && (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {!dash ? (
            <ListSkeleton />
          ) : dash.progress.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-500 text-sm">No practice sessions yet.</p>
              <Link
                to="/generate"
                className="inline-block mt-3 text-sm font-medium text-indigo-600 hover:underline"
              >
                Start your first practice →
              </Link>
            </div>
          ) : (
            dash.progress.map((p) => (
              <div
                key={p._id}
                className="p-4 sm:px-5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {p.chapter}
                    {p.unit ? <span className="text-slate-400"> · {p.unit}</span> : null}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {pretty(p.subject)} · {p.totalCorrect}/{p.totalAttempted} correct
                  </p>
                </div>
                <ScoreBadge value={p.avgScore} />
              </div>
            ))
          )}
        </div>
      )}

      {tab === "leaderboard" && (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {!board ? (
            <ListSkeleton />
          ) : board.leaderboard.length === 0 ? (
            <p className="p-10 text-center text-slate-500 text-sm">No rankings yet.</p>
          ) : (
            board.leaderboard.map((row) => {
              const isMe = row.userId === user?.userId
              return (
                <div
                  key={row.userId}
                  className={`p-4 sm:px-5 flex items-center gap-3 sm:gap-4 ${
                    isMe ? "bg-indigo-50/60" : ""
                  }`}
                >
                  <span
                    className={`w-10 h-10 rounded-full grid place-items-center text-sm font-bold shrink-0 ${
                      row.rank === 1
                        ? "bg-amber-100 text-amber-700 ring-2 ring-amber-200"
                        : row.rank === 2
                        ? "bg-slate-200 text-slate-600 ring-2 ring-slate-300"
                        : row.rank === 3
                        ? "bg-orange-100 text-orange-700 ring-2 ring-orange-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    #{row.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {row.name}
                      {row.rank === 1 && " 🥇"}
                      {row.rank === 2 && " 🥈"}
                      {row.rank === 3 && " 🥉"}
                      {isMe && <span className="ml-1.5 text-xs text-indigo-600">(you)</span>}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.totalCorrect} correct · {row.totalAttempted} attempted
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-700">{row.accuracy}%</p>
                    <p className="text-[11px] text-slate-400">accuracy</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </PageShell>
  )
}
