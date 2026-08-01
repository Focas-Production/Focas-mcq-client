import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import api from "../api/client"
import { useAuth } from "../context/AuthContext"
import AuthLayout from "../components/AuthLayout"

const inputCls =
  "w-full h-11 px-3.5 rounded-xl border border-slate-300 text-[15px] placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
const btnCls =
  "w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[15px] font-medium hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"

export default function Signup() {
  const [step, setStep] = useState("form")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [devOtp, setDevOtp] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const sendOtp = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const { data } = await api.post("/auth/signup/send-otp", {
        name,
        phoneNumber: phone,
      })
      setDevOtp(data.devOtp || null)
      setStep("otp")
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const { data } = await api.post("/auth/signup/verify-otp", {
        phoneNumber: phone,
        otp,
      })
      login(data.token, data.user)
      navigate("/onboarding")
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle={
        step === "form"
          ? "Practice CA exam MCQs with AI-generated questions"
          : `We've sent a 6-digit code to +91 ${phone}`
      }
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-5 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {step === "form" ? (
        <form onSubmit={sendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter your name"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Phone number
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[15px]">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                required
                placeholder="10-digit mobile number"
                className={`${inputCls} pl-12`}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              We'll send a verification code on WhatsApp
            </p>
          </div>
          <button type="submit" disabled={loading || phone.length !== 10} className={btnCls}>
            {loading ? "Sending code..." : "Continue"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-4">
          {devOtp && (
            <div className="px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-sm">
              Test mode — your code is <b>{devOtp}</b>
            </div>
          )}
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
            placeholder="000000"
            className="w-full h-14 rounded-xl border border-slate-300 text-center text-2xl font-semibold tracking-[0.4em] focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
          />
          <button type="submit" disabled={loading || otp.length !== 6} className={btnCls}>
            {loading ? "Verifying..." : "Verify & continue"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("form")
              setOtp("")
            }}
            className="w-full text-sm text-slate-500 hover:text-indigo-600 py-1"
          >
            ← Change details
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
