import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { signupUser, getMe, SignupPayload } from '@/api/auth.api'
import { setAccessToken } from '@/utils/token'
import { getPublicSchools } from '@/api/schools.api'
import { api } from '@/api/axios'
import { School, Career } from '@/types'
import { SECTORS } from '@/constants/sectors'
import { COMBINATIONS } from '@/constants/combinations'
import { PATHWAYS } from '@/constants/pathways'
import { CombinationPathwayPicker } from '@/components/shared/CombinationPathwayPicker'

type SignupRole = 'STUDENT' | 'PROFESSIONAL' | 'CAREER_GUIDE'

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
  pathway?: string
  confidence?: number
  jobTitle?: string
  employer?: string
  sector?: string
  bio?: string
  schoolId?: string
  linkedinUrl?: string
  roleAtSchool?: string
  district?: string
  yearsOfExperience?: string
  additionalNote?: string
}

const ROLE_HOME: Record<string, string> = {
  STUDENT: '/student/home',
  PROFESSIONAL: '/professional/home',
  CAREER_GUIDE: '/career-guide/home',
  ADMIN: '/admin/overview',
}

const Signup = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  const [step, setStep] = useState(1)
  const [step1, setStep1] = useState<Step1Data>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [role, setRole] = useState<SignupRole | null>(null)
  const [step3, setStep3] = useState<Step3Data>({ confidence: 5 })
  const [schools, setSchools] = useState<School[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [careers, setCareers] = useState<Career[]>([])
  const [careersLoading, setCareersLoading] = useState(false)
  const [selectedCareerIds, setSelectedCareerIds] = useState<string[]>([])
  const [aLevelSystem, setALevelSystem] = useState<'legacy' | 'pathway'>('legacy')
  const [combinationsConsidering, setCombinationsConsidering] = useState<string[]>([])
  const [expandedPathway, setExpandedPathway] = useState<string | null>(null)

  useEffect(() => {
    if (step === 3 && (role === 'CAREER_GUIDE' || role === 'STUDENT')) {
      getPublicSchools().then(setSchools).catch(() => {})
    }
  }, [step, role])

  useEffect(() => {
    if (step === 3 && role === 'STUDENT' && step3.level === 'A_LEVEL' && careers.length === 0) {
      setCareersLoading(true)
      api.get('/careers?limit=500')
        .then(({ data }) => setCareers(data.data.careers ?? data.data ?? []))
        .catch(() => {})
        .finally(() => setCareersLoading(false))
    }
  }, [step, role, step3.level, careers.length])

  const toggleCareer = (careerId: string) => {
    setSelectedCareerIds(prev =>
      prev.includes(careerId) ? prev.filter(id => id !== careerId) : [...prev, careerId]
    )
  }

  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  const careerInterests = Array.from(
    new Set(
      careers
        .filter(c => selectedCareerIds.includes(c.id))
        .map(c => c.sector)
    )
  )

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (step1.password !== step1.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (step1.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setStep(2)
  }

  const handleStep2 = (selectedRole: SignupRole) => {
    setRole(selectedRole)
    setStep(3)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if ((role === 'PROFESSIONAL' || role === 'CAREER_GUIDE') && !step3.linkedinUrl?.trim()) {
      setError('LinkedIn profile URL is required.')
      return
    }

    if (step3.linkedinUrl && !step3.linkedinUrl.startsWith('http')) {
      setError('Please enter a valid LinkedIn URL starting with https://')
      return
    }

    if (role === 'STUDENT' && !step3.confidence) {
      setError('Please select your confidence level.')
      return
    }
    if (role === 'STUDENT' && !step3.schoolId) {
      setError('Please select your school.')
      return
    }
    if (role === 'STUDENT' && step3.level === 'A_LEVEL' && !step3.combination && !step3.pathway) {
      setError(aLevelSystem === 'legacy' ? 'Please select your combinations.' : 'Please select your streams.')
      return
    }

    setIsLoading(true)

    try {
      const payload: SignupPayload = {
        email: step1.email,
        password: step1.password,
        role: role!,
        firstName: step1.firstName,
        lastName: step1.lastName,
        ...step3,
        sector: step3.sector,
        linkedinUrl: step3.linkedinUrl,
        ...(role === 'STUDENT' && step3.level === 'A_LEVEL' ? { careerInterests } : {}),
        ...(role === 'STUDENT' && step3.level === 'O_LEVEL' ? { combinationsConsidering } : {}),
      }

      const { accessToken } = await signupUser(payload)

      setAccessToken(accessToken)
      const me = await getMe()
      setAuth(accessToken, me)
      navigate(ROLE_HOME[role!] ?? '/')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })
          ?.response?.data?.error ??
        'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
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
                    onChange={(e) => { setStep1({ ...step1, firstName: e.target.value }); setError(null) }}
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
                    onChange={(e) => { setStep1({ ...step1, lastName: e.target.value }); setError(null) }}
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
                  onChange={(e) => { setStep1({ ...step1, email: e.target.value }); setError(null) }}
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
                    onChange={(e) => { setStep1({ ...step1, password: e.target.value }); setError(null) }}
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
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
                    onChange={(e) => { setStep1({ ...step1, confirmPassword: e.target.value }); setError(null) }}
                    placeholder="Repeat your password"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-start gap-2 mt-2">
                  <AlertCircle className="text-error w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-error text-sm leading-snug">{error}</p>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors mt-2"
              >
                Continue →
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

              {step3.level === 'O_LEVEL' && (
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Which pathway are you considering? <span className="text-muted font-normal">(optional)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PATHWAYS.map((pathway) => {
                      const streams = pathway.streams ?? []
                      const singleLeaf = streams.length === 1 ? streams[0] : undefined
                      const isSelected = singleLeaf
                        ? combinationsConsidering.includes(singleLeaf.code)
                        : streams.some((s) => combinationsConsidering.includes(s.code))
                      return (
                        <button
                          key={pathway.code}
                          type="button"
                          onClick={() => {
                            if (singleLeaf) {
                              toggleItem(singleLeaf.code, combinationsConsidering, setCombinationsConsidering)
                              return
                            }
                            setExpandedPathway((prev) => (prev === pathway.code ? null : pathway.code))
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                            isSelected || expandedPathway === pathway.code
                              ? 'bg-accent text-white border-accent'
                              : 'bg-surface text-primary border-border hover:border-accent'
                          }`}
                        >
                          {pathway.name}
                        </button>
                      )
                    })}
                  </div>

                  {(() => {
                    const expandedPathwayData = PATHWAYS.find(
                      (p) => p.code === expandedPathway && (p.streams?.length ?? 0) > 1
                    )
                    return expandedPathwayData ? (
                      <div className="pl-3 border-l-2 border-border space-y-2 mt-2">
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide">Choose a stream</p>
                        <div className="flex flex-wrap gap-2">
                          {expandedPathwayData.streams!.map((stream) => (
                            <button
                              key={stream.code}
                              type="button"
                              onClick={() => toggleItem(stream.code, combinationsConsidering, setCombinationsConsidering)}
                              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                                combinationsConsidering.includes(stream.code)
                                  ? 'bg-accent text-white border-accent'
                                  : 'bg-surface text-primary border-border hover:border-accent'
                              }`}
                            >
                              {stream.streamName}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null
                  })()}

                  {combinationsConsidering.length === 0 && (
                    <p className="text-xs text-muted mt-1">You can skip this if you haven't decided yet.</p>
                  )}
                </div>
              )}

              {step3.level === 'A_LEVEL' && (
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Which system are you under?</label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {([
                      { key: 'legacy' as const, label: 'Combinations' },
                      { key: 'pathway' as const, label: 'Streams' },
                    ]).map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setALevelSystem(key)
                          setStep3({
                            ...step3,
                            combination: key === 'legacy' ? step3.combination : undefined,
                            pathway: key === 'pathway' ? step3.pathway : undefined,
                          })
                        }}
                        className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          aLevelSystem === key
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border text-primary hover:border-accent'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {aLevelSystem === 'legacy' ? (
                    <div>
                      <label className="block text-sm font-medium text-primary mb-1">
                        Subject combinations <span className="text-error">*</span>
                      </label>
                      <select
                        value={step3.combination ?? ''}
                        onChange={(e) => setStep3({ ...step3, combination: e.target.value, pathway: undefined })}
                        className="w-full px-4 py-2.5 rounded-lg border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="">Select your combinations</option>
                        {COMBINATIONS.map((c) => (
                          <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <CombinationPathwayPicker
                        mode="single"
                        sections={['pathway']}
                        required
                        value={step3.pathway ? [step3.pathway] : []}
                        onChange={(codes) => setStep3({ ...step3, pathway: codes[0], combination: undefined })}
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  School <span className="text-error">*</span>
                </label>
                <select
                  value={step3.schoolId ?? ''}
                  onChange={(e) => setStep3({ ...step3, schoolId: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select your school</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.district}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  How confident are you about your career path? <span className="text-error">*</span>
                  <span className="ml-2 text-accent font-bold">{step3.confidence}/10</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={step3.confidence ?? 5}
                  onChange={(e) => setStep3({ ...step3, confidence: Number(e.target.value) })}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>1 — Not sure at all</span>
                  <span>10 — Very confident</span>
                </div>
              </div>

              {step3.level === 'A_LEVEL' && (
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">
                    What careers interest you? <span className="text-muted font-normal">(optional)</span>
                  </label>
                  {careersLoading ? (
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-border rounded-full h-8 w-20" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto">
                      {careers.map((career) => (
                        <button
                          key={career.id}
                          type="button"
                          onClick={() => toggleCareer(career.id)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            selectedCareerIds.includes(career.id)
                              ? 'bg-accent text-white border-accent'
                              : 'bg-surface text-primary border-border hover:border-accent'
                          }`}
                        >
                          {career.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-start gap-2 mt-2">
                  <AlertCircle className="text-error w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-error text-sm leading-snug">{error}</p>
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
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  LinkedIn Profile URL <span className="text-error">*</span>
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
                  Used by our team to verify your professional background before approval.
                </p>
              </div>
              {error && (
                <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-start gap-2 mt-2">
                  <AlertCircle className="text-error w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-error text-sm leading-snug">{error}</p>
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
                <label className="block text-sm font-medium text-primary mb-1">
                  LinkedIn Profile URL <span className="text-error">*</span>
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
                  Used to verify your role before your account is approved.
                </p>
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
                <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 flex items-start gap-2 mt-2">
                  <AlertCircle className="text-error w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-error text-sm leading-snug">{error}</p>
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
