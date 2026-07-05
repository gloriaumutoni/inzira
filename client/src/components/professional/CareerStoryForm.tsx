import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import type { CareerStoryPayload } from '@/api/careerStories.api'

export const SECTORS = [
  'Engineering', 'Healthcare', 'Technology', 'Finance & Banking',
  'Education', 'Agriculture', 'Media & Communications', 'Law',
  'Public Service', 'Business & Entrepreneurship',
]

export const EMPTY_FORM: CareerStoryPayload = {
  jobTitle: '',
  sector: '',
  combinations: [],
  myPath: '',
  whatIDo: '',
  adviceForStudents: '',
}

const MAX_WORDS = 300

function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <label className="text-xs font-medium text-muted uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

export function CareerStoryForm({
  initialValues,
  combinations,
  onSubmit,
  onCancel,
  submitLabel,
  loading,
  error,
}: {
  initialValues: CareerStoryPayload
  combinations: string[]
  onSubmit: (data: CareerStoryPayload) => void
  onCancel: () => void
  submitLabel: string
  loading: boolean
  error: string
}) {
  const [form, setForm] = useState<CareerStoryPayload>(initialValues)
  const [wordLimitHit, setWordLimitHit] = useState<Partial<Record<keyof CareerStoryPayload, boolean>>>({})

  const set = (key: keyof CareerStoryPayload, value: string | string[]) =>
    setForm(f => ({ ...f, [key]: value }))

  const setBounded = (key: keyof CareerStoryPayload, value: string) => {
    if (countWords(value) <= MAX_WORDS) {
      set(key, value)
      setWordLimitHit(h => ({ ...h, [key]: false }))
    } else {
      setWordLimitHit(h => ({ ...h, [key]: true }))
    }
  }

  const toggleCombo = (c: string) =>
    set('combinations', form.combinations.includes(c)
      ? form.combinations.filter(x => x !== c)
      : [...form.combinations, c])

  const valid =
    form.jobTitle.trim().length > 0 &&
    form.sector.length > 0 &&
    form.combinations.length > 0 &&
    form.myPath.trim().length >= 150 &&
    form.whatIDo.trim().length >= 100 &&
    form.adviceForStudents.trim().length >= 100

  return (
    <form
      onSubmit={e => { e.preventDefault(); if (valid) onSubmit(form) }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Job title">
          <input
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:border-primary"
            value={form.jobTitle}
            onChange={e => set('jobTitle', e.target.value)}
            placeholder="e.g. Civil Engineer"
          />
        </Field>
        <Field label="Sector">
          <select
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:border-primary"
            value={form.sector}
            onChange={e => set('sector', e.target.value)}
          >
            <option value="">Select sector</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Which A-Level combinations lead to your career?">
        <div className="flex flex-wrap gap-2 mt-1">
          {combinations.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCombo(c)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                form.combinations.includes(c)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface border-border text-muted hover:border-primary'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {form.combinations.length === 0 && (
          <p className="text-xs text-muted mt-1">Select at least one combination.</p>
        )}
      </Field>

      <Field label="How did you get here? Walk us through your path from secondary school to today">
        <textarea
          className="w-[80%] border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary min-h-[120px] resize-y focus:outline-none focus:border-primary"
          value={form.myPath}
          onChange={e => setBounded('myPath', e.target.value)}
          placeholder="Tell students about your journey from A-Levels to where you are now..."
        />
        <p className="text-xs mt-1 text-muted">{countWords(form.myPath)}/{MAX_WORDS} words</p>
        {wordLimitHit.myPath && (
          <p className="text-xs mt-1 text-error">Can't exceed {MAX_WORDS} words.</p>
        )}
      </Field>

      <Field label="What does your work actually involve?">
        <textarea
          className="w-[80%] border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary min-h-[100px] resize-y focus:outline-none focus:border-primary"
          value={form.whatIDo}
          onChange={e => setBounded('whatIDo', e.target.value)}
          placeholder="Describe a typical day or week in your role..."
        />
        <p className="text-xs mt-1 text-muted">{countWords(form.whatIDo)}/{MAX_WORDS} words</p>
        {wordLimitHit.whatIDo && (
          <p className="text-xs mt-1 text-error">Can't exceed {MAX_WORDS} words.</p>
        )}
      </Field>

      <Field label="What advice would you give a student considering this combination?">
        <textarea
          className="w-[80%] border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary min-h-[100px] resize-y focus:outline-none focus:border-primary"
          value={form.adviceForStudents}
          onChange={e => setBounded('adviceForStudents', e.target.value)}
          placeholder="Practical advice, things you wish you knew, encouragement..."
        />
        <p className="text-xs mt-1 text-muted">{countWords(form.adviceForStudents)}/{MAX_WORDS} words</p>
        {wordLimitHit.adviceForStudents && (
          <p className="text-xs mt-1 text-error">Can't exceed {MAX_WORDS} words.</p>
        )}
      </Field>

      {error && (
        <div className="flex items-start gap-2 text-sm text-error bg-error/5 border border-error/20 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm px-4 py-2 rounded-lg border border-border hover:border-primary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!valid || loading}
          className="text-sm px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {loading ? 'Submitting…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
