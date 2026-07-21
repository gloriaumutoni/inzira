import { useState, type KeyboardEvent } from 'react'
import { AlertCircle, X } from 'lucide-react'
import type { CareerStoryPayload } from '@/api/careerStories.api'
import { STREAM_CODES, STREAM_MAP, type StreamCode } from '@/constants/streams'

export const SECTORS = [
  'Engineering', 'Healthcare', 'Technology', 'Finance & Banking',
  'Education', 'Agriculture', 'Media & Communications', 'Law',
  'Public Service', 'Business & Entrepreneurship',
]

export const EMPTY_FORM: CareerStoryPayload = {
  jobTitle: '',
  sector: '',
  streamCodes: [],
  combinations: [],
  myPath: '',
  whatIDo: '',
  adviceForStudents: '',
  universityStudied: '',
  program: '',
  entryRequirements: '',
  firstJobStep: '',
  yearsToGetThere: '',
  keySkills: [],
  linkedCareerId: '',
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

export interface CareerOption {
  id: string
  title: string
}

export function CareerStoryForm({
  initialValues,
  combinations,
  careers = [],
  onSubmit,
  onCancel,
  submitLabel,
  loading,
  error,
}: Readonly<{
  initialValues: CareerStoryPayload
  combinations: string[]
  careers?: CareerOption[]
  onSubmit: (data: CareerStoryPayload) => void
  onCancel: () => void
  submitLabel: string
  loading: boolean
  error: string
}>) {
  const [form, setForm] = useState<CareerStoryPayload>(initialValues)
  const [wordLimitHit, setWordLimitHit] = useState<Partial<Record<keyof CareerStoryPayload, boolean>>>({})
  const [skillDraft, setSkillDraft] = useState('')

  const set = <K extends keyof CareerStoryPayload>(key: K, value: CareerStoryPayload[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  const setBounded = (key: keyof CareerStoryPayload, value: string) => {
    if (countWords(value) <= MAX_WORDS) {
      set(key, value)
      setWordLimitHit(h => ({ ...h, [key]: false }))
    } else {
      setWordLimitHit(h => ({ ...h, [key]: true }))
    }
  }

  const toggleStream = (code: StreamCode) =>
    set('streamCodes', form.streamCodes.includes(code)
      ? form.streamCodes.filter(x => x !== code)
      : [...form.streamCodes, code])

  const toggleCombo = (c: string) =>
    set('combinations', form.combinations.includes(c)
      ? form.combinations.filter(x => x !== c)
      : [...form.combinations, c])

  const addSkill = () => {
    const skill = skillDraft.trim()
    if (skill && !form.keySkills.includes(skill)) {
      set('keySkills', [...form.keySkills, skill])
    }
    setSkillDraft('')
  }

  const removeSkill = (skill: string) =>
    set('keySkills', form.keySkills.filter(s => s !== skill))

  const valid =
    form.jobTitle.trim().length > 0 &&
    form.sector.length > 0 &&
    form.streamCodes.length > 0 &&
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

      <Field label="Which stream(s) lead to your career?">
        <div className="flex flex-wrap gap-2 mt-1">
          {STREAM_CODES.map(code => (
            <button
              key={code}
              type="button"
              onClick={() => toggleStream(code)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                form.streamCodes.includes(code)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface border-border text-muted hover:border-primary'
              }`}
            >
              {STREAM_MAP[code].name}
            </button>
          ))}
        </div>
        {form.streamCodes.length === 0 && (
          <p className="text-xs text-muted mt-1">Select at least one stream.</p>
        )}
      </Field>

      {combinations.length > 0 && (
        <Field label="Legacy A-Level combinations (optional — being phased out)">
          <div className="flex flex-wrap gap-2 mt-1">
            {combinations.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCombo(c)}
                className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                  form.combinations.includes(c)
                    ? 'bg-accent/10 text-accent border-accent'
                    : 'bg-surface border-border text-muted hover:border-accent'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>
      )}

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

      <Field label="What advice would you give a student considering this path?">
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

      <div className="border-t border-border pt-5 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-primary">Roadmap details (optional)</h4>
          <p className="text-xs text-muted mt-0.5">Stories with roadmap details help 3× more students.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="University / institution studied at">
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:border-primary"
              value={form.universityStudied}
              onChange={e => set('universityStudied', e.target.value)}
              placeholder="e.g. University of Rwanda"
            />
          </Field>
          <Field label="Program / degree">
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:border-primary"
              value={form.program}
              onChange={e => set('program', e.target.value)}
              placeholder="e.g. Bachelor of Medicine"
            />
          </Field>
        </div>

        <Field label="Entry requirements (grades/principals needed)">
          <input
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:border-primary"
            value={form.entryRequirements}
            onChange={e => set('entryRequirements', e.target.value)}
            placeholder="e.g. Biology & Chemistry principal passes, min 2 principals"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First realistic role out of school/uni">
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:border-primary"
              value={form.firstJobStep}
              onChange={e => set('firstJobStep', e.target.value)}
              placeholder="e.g. Junior developer"
            />
          </Field>
          <Field label="Years to get there">
            <input
              type="number"
              min={0}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:border-primary"
              value={form.yearsToGetThere}
              onChange={e => set('yearsToGetThere', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 6"
            />
          </Field>
        </div>

        <Field label="Key skills">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.keySkills.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full"
              >
                {skill}
                <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:border-primary"
            value={skillDraft}
            onChange={e => setSkillDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addSkill()
              }
            }}
            onBlur={addSkill}
            placeholder="Type a skill and press Enter"
          />
        </Field>

        {careers.length > 0 && (
          <Field label="Link to a career roadmap">
            <select
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-primary focus:outline-none focus:border-primary"
              value={form.linkedCareerId}
              onChange={e => set('linkedCareerId', e.target.value)}
            >
              <option value="">Not linked</option>
              {careers.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </Field>
        )}
      </div>

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
