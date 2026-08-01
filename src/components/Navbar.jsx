import { Link, NavLink, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
      />
    ),
  },
  {
    to: "/generate",
    label: "Practice",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v12m6-6H6"
      />
    ),
  },
  // Results section hidden for now — uncomment to re-enable
  // {
  //   to: "/results",
  //   label: "Results",
  //   icon: (
  //     <path
  //       strokeLinecap="round"
  //       strokeLinejoin="round"
  //       d="M9 12h6m-6 4h6M9 8h6m-8.25 12h10.5A2.25 2.25 0 0019.5 17.75V6.25A2.25 2.25 0 0017.25 4H6.75A2.25 2.25 0 004.5 6.25v11.5A2.25 2.25 0 006.75 20z"
  //     />
  //   ),
  // },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <>
      {/* Top bar */}
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center">
            <img src="/focas logo.png" alt="FOCAS" className="h-9 w-auto" />
          </Link>

          {user && (
            <div className="flex items-center gap-1">
              {/* Desktop links */}
              <nav className="hidden md:flex items-center gap-1 mr-2">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <span className="hidden sm:block text-sm text-slate-500 mr-2 max-w-28 truncate">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile bottom navigation */}
      {user && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-3">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                    active ? "text-indigo-600" : "text-slate-500"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    {item.icon}
                  </svg>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </>
  )
}
