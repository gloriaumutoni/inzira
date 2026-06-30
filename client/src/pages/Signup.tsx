import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { signupUser, getMe, checkEmail, SignupPayload } from '@/api/auth.api'
import { api } from '@/api/axios'
import { setAccessToken } from '@/utils/token'
import { getPublicSchools } from '@/api/schools.api'
import { School } from '@/types'

type SignupRole = 'STUDENT' | 'PROFESSIONAL' | 'CAREER_GUIDE'

const COMBINATIONS = [
  'MPC — Mathematics, Physics, Computer Science',
  'MPG — Mathematics, Physics, Geography',
  'MEG — Mathematics, Economics, Geography',
  'MHE — Mathematics, History, Economics',
  'MCE — Mathematics, Chemistry, Economics',
  'PCB — Physics, Chemistry, Biology',
  'BCG — Biology, Chemistry, Geography',
  'HEG — History, Economics, Geography',
  'HEL — History, Economics, Literature',
  'HGL — History, Geography, Literature',
  'KEG — Kinyarwanda, Economics, Geography',
  'KEL — Kinyarwanda, Economics, Literature',
  'KGL — Kinyarwanda, Geography, Literature',
  'AEG — Agriculture, Economics, Geography',
  'PCG — Physics, Chemistry, Geography',
]

const SECTORS = [
  'ICT', 'Engineering', 'Healthcare', 'Finance',
  'Education', 'Agriculture', 'Law', 'Architecture',
  'Arts & Media', 'Business', 'Manufacturing', 'Logistics', 'Other',
]


interface Step1Data {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

interface Step3Data {
  level?: 'O_LEVEL' | 'A_LEVEL'
  combination?: string
  careerIds?: string[]
  confidence?: number
  jobTitle?: string
  employer?: string
  sector?: string
  otherSector?: string
  bio?: string
  companyName?: string
  companySize?: string
  contactPerson?: string
  contactPhone?: string
  schoolId?: string
  roleAtSchool?: string
  district?: string
  yearsOfExperience?: string
  additionalNote?: string
  selectedSectors?: string[]
  linkedinUrl?: string
}

const ROLE_HOME: Record<string, string> = {
  STUDENT: '/student/home',
  PROFESSIONAL: '/professional/home',
  ADMIN: '/admin/overview',
}

const Signup = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [step1, setStep1] = useState<Step1Data>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [role, setRole] = useState<SignupRole | null>(null)
  const [step3, setStep3] = useState<Step3Data>({})
  const [schools, setSchools] = useState<School[]>([])
  const [signupCareers, setSignupCareers] = useState<{ id: string; title: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (step === 3 && (role === 'CAREER_GUIDE' || role === 'STUDENT')) {
      getPublicSchools().then(setSchools).catch(() => {})
    }
  }, [step, role])

  useEffect(() => {
    if (step === 3 && role === 'PROFESSIONAL') {
      api.get('/careers?includeUnmatched=true').then(({ data }) => {
        setSignupCareers(data.data.careers ?? [])
      }).catch(() => {})
    }
  }, [step, role])

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (step1.password !== step1.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (step1.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setCheckingEmail(true)
    try {
      const result = await checkEmail(step1.email)
      if (!result.available) {
        setError('An account with this email already exists. Try logging in instead.')
        setCheckingEmail(false)
        return
      }
    } catch {
      setError('Could not verify email. Please try again.')
      setCheckingEmail(false)
      return
    }
    setCheckingEmail(false)
    setStep(2)
  }

  const handleStep2 = (selectedRole: SignupRole) => {
    setRole(selectedRole)
    setStep(3)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const payload: SignupPayload = {
        email: step1.email,
        password: step1.password,
        role: role!,
        firstName: step1.firstName,
        lastName: step1.lastName,
        ...step3,
        sector: step3.sector === 'Other' ? (step3.otherSector ?? '') : (step3.sector ?? step3.selectedSectors?.[0]),
        linkedinUrl: step3.linkedinUrl,
      }

      const { accessToken } = await signupUser(payload)

      if (role === 'CAREER_GUIDE') {
        setSubmitted(true)
        return
      }

      setAccessToken(accessToken)

      if (role === 'PROFESSIONAL' && (step3.careerIds?.length ?? 0) > 0) {
        try {
          await api.patch('/professionals/me/careers', { careerIds: step3.careerIds })
        } catch {}
      }

      const me = await getMe()
      setAuth(accessToken, me)
      navigate(ROLE_HOME[role!] ?? '/')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.error ??
        (err as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.message ??
        'Signup failed. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-surface rounded-2xl shadow-card p-8 text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-primary mb-2">Request submitted</h2>
          <p className="text-muted text-sm">
            Your Career Guide account is under review. You will receive an email
            once approved. This usually takes 1–2 business days.
          </p>
          <Link
            to="/"
            className="inline-block mt-6 text-accent text-sm font-medium hover:underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-card p-8">

        <div className="text-center mb-6">
          <Link to="/" className="text-2xl font-bold text-primary hover:text-accent transition-colors">Inzira</Link>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step ? 'w-8 bg-accent' : s < step ? 'w-2 bg-accent/40' : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-primary">Create your account</h2>
              <p className="text-muted text-sm mt-1">Let's start with the basics</p>
            </div>
            <form onSubmit={handleStep1} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">First Name</label>
                  <input
                    type="text"
                    value={step1.firstName}
                    onChange={(e) => setStep1({ ...step1, firstName: e.target.value })}
                    placeholder="First name"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Last Name</label>
                  <input
                    type="text"
                    value={step1.lastName}
                    onChange={(e) => setStep1({ ...step1, lastName: e.target.value })}
                    placeholder="Last name"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Email</label>
                <input
                  type="email"
                  value={step1.email}
                  onChange={(e) => setStep1({ ...step1, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={step1.password}
                    onChange={(e) => setStep1({ ...step1, password: e.target.value })}
                    placeholder="At least 8 characters"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={step1.confirmPassword}
                    onChange={(e) => setStep1({ ...step1, confirmPassword: e.target.value })}
                    placeholder="Repeat your password"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="bg-error/10 border border-error/20 rounded-lg px-3 py-2">
                  <p className="text-error text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={checkingEmail}
                className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors mt-2 disabled:opacity-60"
              >
                {checkingEmail ? 'Checking...' : 'Continue →'}
              </button>
            </form>
            <p className="text-center text-sm text-muted mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-medium hover:underline">Sign in</Link>
            </p>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-primary">What describes you best?</h2>
              <p className="text-muted text-sm mt-1">Choose your role on Inzira</p>
            </div>
            <div className="space-y-3">
              {[
                { role: 'STUDENT' as SignupRole, label: 'Student', desc: "I'm a secondary school student exploring career paths" },
                { role: 'PROFESSIONAL' as SignupRole, label: 'Professional', desc: "I'm a working professional who wants to mentor students" },
                { role: 'CAREER_GUIDE' as SignupRole, label: 'Career Guide', desc: "I provide career guidance at a secondary school" },
              ].map(({ role: r, label, desc }) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleStep2(r)}
                  className="w-full text-left border border-border rounded-xl p-4 hover:border-accent hover:bg-accent/5 transition-all"
                >
                  <p className="font-semibold text-primary text-sm">{label}</p>
                  <p className="text-muted text-xs mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-muted text-sm mt-4 hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          </>
        )}

        {/* Step 3 — Student */}
        {step === 3 && role === 'STUDENT' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-primary">Tell us about your studies</h2>
              <p className="text-muted text-sm mt-1">This helps us personalise your experience</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">What level are you in?</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['O_LEVEL', 'A_LEVEL'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setStep3({ ...step3, level: l })}
                      className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                        step3.level === l
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-primary hover:border-accent'
                      }`}
                    >
                      {l === 'O_LEVEL' ? 'O-Level' : 'A-Level'}
                      <p className="text-xs font-normal text-muted mt-0.5">
                        {l === 'O_LEVEL' ? 'S1 – S3' : 'S4 – S6'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {step3.level === 'A_LEVEL' && (
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Subject combination <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <select
                    value={step3.combination ?? ''}
                    onChange={(e) => setStep3({ ...step3, combination: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select your combination</option>
                    {COMBINATIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary mb-3">
                  How confident are you about your career path?{' '}
                  <span className="text-muted font-normal text-xs">(optional)</span>
                </label>
                <div className="flex gap-3 justify-center mt-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div key={value} className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => setStep3({ ...step3, confidence: value })}
                        className={
                          step3.confidence === value
                            ? 'w-10 h-10 rounded-full border-2 border-accent bg-accent flex items-center justify-center text-sm font-semibold text-white transition-all'
                            : 'w-10 h-10 rounded-full border-2 border-border bg-surface flex items-center justify-center text-sm font-semibold text-muted cursor-pointer hover:border-accent hover:text-accent transition-all'
                        }
                      >
                        {value}
                      </button>
                      <span className="text-xs text-muted text-center mt-1 h-4">
                        {value === 1 ? 'Not sure' : value === 3 ? 'Some idea' : value === 5 ? 'Very sure' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Which school do you attend?
                </label>
                <select
                  value={step3.schoolId ?? ''}
                  onChange={(e) => setStep3({ ...step3, schoolId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select your school (optional)</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.district}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-error/10 border border-error/20 rounded-lg px-3 py-2">
                  <p className="text-error text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={!step3.level || isLoading}
                className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {isLoading ? 'Creating account...' : 'Create my account →'}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1 text-muted text-sm hover:text-primary mx-auto"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            </form>
          </>
        )}

        {/* Step 3 — Professional */}
        {step === 3 && role === 'PROFESSIONAL' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-primary">Tell us about your work</h2>
              <p className="text-muted text-sm mt-1">Students will use this to find you</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Job Title</label>
                <input
                  type="text"
                  value={step3.jobTitle ?? ''}
                  onChange={(e) => setStep3({ ...step3, jobTitle: e.target.value })}
                  placeholder="e.g. Software Engineer"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Employer</label>
                <input
                  type="text"
                  value={step3.employer ?? ''}
                  onChange={(e) => setStep3({ ...step3, employer: e.target.value })}
                  placeholder="Company or organisation name"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={step3.linkedinUrl ?? ''}
                  onChange={(e) => setStep3({ ...step3, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/yourname"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-muted mt-1">
                  Our team uses this to verify your professional background.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Industry Sector</label>
                <select
                  value={step3.sector ?? ''}
                  onChange={(e) => setStep3({ ...step3, sector: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select sector</option>
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {step3.sector === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Please specify your sector</label>
                  <input
                    type="text"
                    value={step3.otherSector ?? ''}
                    onChange={(e) => setStep3({ ...step3, otherSector: e.target.value })}
                    placeholder="e.g. Real Estate"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Bio</label>
                <textarea
                  value={step3.bio ?? ''}
                  onChange={(e) => setStep3({ ...step3, bio: e.target.value })}
                  placeholder="Tell students about your career journey"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
              {signupCareers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    Which careers do you represent?
                  </label>
                  <p className="text-xs text-muted mb-2">
                    Select the career(s) students should be able to find you under.
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-border rounded-lg p-3">
                    {signupCareers.map((career) => (
                      <button
                        key={career.id}
                        type="button"
                        onClick={() => {
                          const current = step3.careerIds ?? []
                          setStep3({
                            ...step3,
                            careerIds: current.includes(career.id)
                              ? current.filter((id) => id !== career.id)
                              : [...current, career.id],
                          })
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          (step3.careerIds ?? []).includes(career.id)
                            ? 'bg-accent text-white border-accent'
                            : 'border-border text-primary hover:border-accent'
                        }`}
                      >
                        {career.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {error && (
                <div className="bg-error/10 border border-error/20 rounded-lg px-3 py-2">
                  <p className="text-error text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {isLoading ? 'Creating account...' : 'Create my account →'}
              </button>
              <button type="button" onClick={() => setStep(2)} className="flex items-center gap-1 text-muted text-sm hover:text-primary mx-auto">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            </form>
          </>
        )}

        {/* Step 3 — Career Guide */}
        {step === 3 && role === 'CAREER_GUIDE' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-primary">Tell us about your role</h2>
              <p className="text-muted text-sm mt-1">We will connect you with the right school and student cohort</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">School</label>
                <select
                  value={step3.schoolId ?? ''}
                  onChange={(e) => setStep3({ ...step3, schoolId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select your school</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.district}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Your Role at the School</label>
                <input
                  type="text"
                  value={step3.roleAtSchool ?? ''}
                  onChange={(e) => setStep3({ ...step3, roleAtSchool: e.target.value })}
                  placeholder="e.g. Career Guidance Counsellor"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">District</label>
                  <select
                    value={step3.district ?? ''}
                    onChange={(e) => setStep3({ ...step3, district: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select district</option>
                    <option>Gasabo</option>
                    <option>Nyarugenge</option>
                    <option>Kicukiro</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Experience</label>
                  <select
                    value={step3.yearsOfExperience ?? ''}
                    onChange={(e) => setStep3({ ...step3, yearsOfExperience: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Years of exp.</option>
                    <option>Less than 1 year</option>
                    <option>1–3 years</option>
                    <option>3–5 years</option>
                    <option>5–10 years</option>
                    <option>10+ years</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Additional note <span className="text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  value={step3.additionalNote ?? ''}
                  onChange={(e) => setStep3({ ...step3, additionalNote: e.target.value })}
                  placeholder="Anything else we should know?"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
              {error && (
                <div className="bg-error/10 border border-error/20 rounded-lg px-3 py-2">
                  <p className="text-error text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {isLoading ? 'Submitting...' : 'Submit for review →'}
              </button>
              <button type="button" onClick={() => setStep(2)} className="flex items-center gap-1 text-muted text-sm hover:text-primary mx-auto">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  )
}

export default Signup
