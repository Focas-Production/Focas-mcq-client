import Navbar from "./Navbar"

export default function PageShell({ title, subtitle, action, children }) {
  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {(title || action) && (
          <div className="flex items-start sm:items-center justify-between gap-3 mb-6 flex-col sm:flex-row">
            <div>
              {title && (
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
                  {title}
                </h1>
              )}
              {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {action}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
