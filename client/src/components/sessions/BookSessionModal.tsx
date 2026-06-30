import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ChevronLeft, CheckCircle, ChevronRight } from 'lucide-react'
import { api } from '@/api/axios'
import { toast } from '@/utils/toast'

interface ProfessionalSnippet {
  id: string
  firstName: string
  lastName: string
  jobTitle: string
  profilePhoto?: string | null
  offersFreeIntro: boolean
  offersProTier: boolean
  proRate: number
}

interface AvailableSlot {
  date: string
  startTime: string
  endTime: string
}

interface BookSessionModalProps {
  professional: ProfessionalSnippet
  defaultType: 'FREE_INTRO' | 'PRO' | 'GROUP'
  groupSessionId?: string | null
  onClose: () => void
}

const DURATION_MAP = {
  FREE_INTRO: 20,
  PRO: 60,
  GROUP: 60,
}

const COST_MAP = (pro: ProfessionalSnippet) => ({
  FREE_INTRO: 0,
  PRO: pro.proRate,
  GROUP: 0,
})

const TYPE_LABELS = {
  FREE_INTRO: 'Free Intro Session',
  PRO: 'Mentorship Session',
  GROUP: 'Group Session',
}

const BookSessionModal = ({
  professional,
  defaultType,
  groupSessionId,
  onClose,
}: BookSessionModalProps) => {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedType, setSelectedType] = useState<'FREE_INTRO' | 'PRO' | 'GROUP'>(defaultType)
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'MOMO'>('MOMO')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [momoPhone, setMomoPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const cost = COST_MAP(professional)[selectedType]
  const initials = `${professional.firstName[0] ?? ''}${professional.lastName[0] ?? ''}`.toUpperCase()

  const fetchSlots = async () => {
    setSlotsLoading(true)
    try {
      const { data } = await api.get(`/google-calendar/slots/${professional.id}`)
      setSlots(data.data.slots ?? data.data ?? [])
    } catch {
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  useEffect(() => {
    if (step === 2 && (selectedType === 'FREE_INTRO' || selectedType === 'PRO')) {
      fetchSlots()
    }
  }, [step])

  const handleNext = () => {
    if (step === 1) {
      if (selectedType === 'GROUP') {
        setStep(3)
      } else {
        setStep(2)
      }
    } else if (step === 2) {
      setStep(3)
    }
  }

  const isPaymentValid = () => {
    if (cost === 0) return true
    if (paymentMethod === 'MOMO') return momoPhone.length >= 10
    return cardNumber.length >= 16 && cardExpiry.length >= 4 && cardCvv.length >= 3
  }

  const handleConfirm = async () => {
    if (!consent || !isPaymentValid()) return
    setSubmitting(true)
    try {
      if (selectedType === 'GROUP' && groupSessionId) {
        await api.post(`/group-sessions/${groupSessionId}/enrol`)
      } else if (selectedSlot) {
        const scheduledAt = new Date(
          `${selectedSlot.date}T${selectedSlot.startTime}`,
        ).toISOString()
        await api.post('/sessions', {
          professionalId: professional.id,
          type: selectedType,
          scheduledAt,
          duration: DURATION_MAP[selectedType],
        })
      }
      setConfirmed(true)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="bg-surface w-full max-w-md rounded-2xl p-8 text-center shadow-xl">
          <CheckCircle className="h-12 w-12 text-accent mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary">Session Confirmed!</h2>
          <p className="text-sm text-muted mt-2">
            {TYPE_LABELS[selectedType]} with {professional.firstName} {professional.lastName}
            {selectedSlot
              ? ` on ${new Date(`${selectedSlot.date}T${selectedSlot.startTime}`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${selectedSlot.startTime}`
              : ''}
          </p>
          <button
            onClick={() => {
              onClose()
              navigate('/student/sessions')
            }}
            className="mt-6 bg-primary text-white text-sm px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to My Sessions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {professional.profilePhoto ? (
              <img
                src={professional.profilePhoto}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent/10 text-accent font-semibold flex items-center justify-center text-sm">
                {initials}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-primary">
                {professional.firstName} {professional.lastName}
              </p>
              <p className="text-xs text-muted">{professional.jobTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {/* Step 1 — Choose type */}
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary mb-4">Choose session type</h3>

              {professional.offersFreeIntro && (
                <button
                  type="button"
                  onClick={() => setSelectedType('FREE_INTRO')}
                  className={`w-full text-left border rounded-xl p-4 transition-all ${
                    selectedType === 'FREE_INTRO'
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent'
                  }`}
                >
                  <p className="text-sm font-semibold text-primary">Free Intro Session</p>
                  <p className="text-xs text-muted mt-0.5">20 min · 1-on-1 · Free</p>
                </button>
              )}

              {professional.offersProTier && (
                <button
                  type="button"
                  onClick={() => setSelectedType('PRO')}
                  className={`w-full text-left border rounded-xl p-4 transition-all ${
                    selectedType === 'PRO'
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent'
                  }`}
                >
                  <p className="text-sm font-semibold text-primary">1-on-1 Mentorship Session</p>
                  <p className="text-xs text-muted mt-0.5">
                    60 min · 1-on-1 · {professional.proRate.toLocaleString()} RWF
                  </p>
                </button>
              )}

              <button
                type="button"
                onClick={() => groupSessionId && setSelectedType('GROUP')}
                disabled={!groupSessionId}
                className={`w-full text-left border rounded-xl p-4 transition-all ${
                  !groupSessionId
                    ? 'border-border opacity-50 cursor-not-allowed'
                    : selectedType === 'GROUP'
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent'
                }`}
              >
                <p className="text-sm font-semibold text-primary">Join a Group Session</p>
                <p className="text-xs text-muted mt-0.5">
                  {groupSessionId ? 'Upcoming group session available' : 'No upcoming group sessions'}
                </p>
              </button>

              <p className="text-xs text-muted pt-2 border-t border-border">
                💡 Book 4 sessions this month for 15,000 RWF — save 5,000 RWF.
              </p>
            </div>
          )}

          {/* Step 2 — Pick date and time */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary">Choose a date and time</h3>

              {slotsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse bg-border rounded-lg h-12" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div className="bg-background rounded-xl p-4 border border-border text-center">
                  <p className="text-sm text-muted">
                    This professional has not set their availability yet. Send them a message to arrange a time.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {slots.map((slot, i) => {
                    const dateLabel = new Date(`${slot.date}T${slot.startTime}`).toLocaleDateString(
                      'en-US',
                      { weekday: 'short', month: 'short', day: 'numeric' },
                    )
                    const isSelected =
                      selectedSlot?.date === slot.date &&
                      selectedSlot?.startTime === slot.startTime
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/10 text-accent font-medium'
                            : 'border-border text-primary hover:border-accent'
                        }`}
                      >
                        {dateLabel} · {slot.startTime} – {slot.endTime}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Confirm and pay */}
          {step === 3 && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-primary">Confirm your booking</h3>

              {/* Summary */}
              <div className="bg-background rounded-xl p-4 border border-border space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Session type</span>
                  <span className="font-medium text-primary">{TYPE_LABELS[selectedType]}</span>
                </div>
                {selectedSlot && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Date & time</span>
                    <span className="font-medium text-primary">
                      {new Date(`${selectedSlot.date}T${selectedSlot.startTime}`).toLocaleDateString(
                        'en-US',
                        { weekday: 'short', month: 'short', day: 'numeric' },
                      )}{' '}
                      {selectedSlot.startTime}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Duration</span>
                  <span className="font-medium text-primary">{DURATION_MAP[selectedType]} min</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-border pt-1.5 mt-1.5">
                  <span className="text-primary">Total</span>
                  <span className="text-primary">
                    {cost === 0 ? 'Free' : `${cost.toLocaleString()} RWF`}
                  </span>
                </div>
              </div>

              {/* Payment */}
              {cost > 0 && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {(['MOMO', 'CARD'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                          paymentMethod === m
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border text-muted hover:border-accent'
                        }`}
                      >
                        {m === 'MOMO' ? 'MTN Mobile Money' : 'Card'}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'MOMO' ? (
                    <div>
                      <label className="block text-xs font-medium text-primary mb-1">
                        Phone number
                      </label>
                      <input
                        type="tel"
                        value={momoPhone}
                        onChange={(e) => setMomoPhone(e.target.value)}
                        placeholder="+250 7XX XXX XXX"
                        className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      <p className="text-xs text-muted mt-1">
                        You will receive a prompt on your phone to confirm this payment.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="Card number"
                        maxLength={19}
                        className="w-full px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM / YY"
                          maxLength={5}
                          className="px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <input
                          type="text"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="CVV"
                          maxLength={4}
                          className="px-4 py-2.5 rounded-lg border border-border text-primary placeholder:text-subtle text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Consent */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 accent-accent"
                />
                <span className="text-xs text-muted leading-relaxed">
                  I understand this session is non-refundable if cancelled within 24 hours of the start time.
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s === 3 && selectedType === 'GROUP' ? 1 : (s - 1) as 1 | 2 | 3))}
              className="flex items-center gap-1 text-sm text-muted hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={
                (step === 1 && !selectedType) ||
                (step === 2 && !selectedSlot && slots.length > 0)
              }
              className="flex items-center gap-1 bg-primary text-white text-sm px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!consent || !isPaymentValid() || submitting}
              className="bg-accent text-white text-sm px-5 py-2 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Confirming...' : 'Confirm Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export { BookSessionModal }
export default BookSessionModal
