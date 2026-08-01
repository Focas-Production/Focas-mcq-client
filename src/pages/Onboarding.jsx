import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import MCQWizard from "../components/MCQWizard"

export default function Onboarding() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <img src="/focas logo.png" alt="FOCAS" className="h-9 w-auto" />
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-slate-500 hover:text-rose-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-16">
        <div className="max-w-2xl mx-auto mb-8 text-center">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
            Welcome, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Let's set up your first practice session
          </p>
        </div>
        <MCQWizard isOnboarding />
      </main>
    </div>
  )
}
