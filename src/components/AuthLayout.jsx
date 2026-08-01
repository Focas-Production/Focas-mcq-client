export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -top-28 -right-28 w-96 h-96 bg-violet-300/30 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-28 w-96 h-96 bg-indigo-300/30 rounded-full blur-3xl" />

      <div className="flex-1 flex items-center justify-center px-4 py-10 relative">
        <div className="w-full max-w-105">
          {/* Brand */}
          <div className="flex justify-center mb-8">
            <img src="/focas logo.png" alt="FOCAS" className="h-14 w-auto" />
          </div>

          <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 p-6 sm:p-8">
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 mt-1 mb-6">{subtitle}</p>}
            {children}
          </div>

          {footer && <div className="text-center mt-6 text-sm text-slate-500">{footer}</div>}
        </div>
      </div>
      <p className="text-center text-xs text-slate-400 pb-6 relative">
        © {new Date().getFullYear()} FOCAS Edu · All rights reserved
      </p>
    </div>
  )
}
