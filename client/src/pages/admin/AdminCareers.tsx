import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { STREAM_CODES, STREAM_MAP } from '@/constants/streams'
import {
  useAdminCareersQuery,
  useCreateCareerMutation,
  useUpdateCareerMutation,
  useToggleCareerMutation,
  useDeleteCareerMutation,
  useAddStepMutation,
  useUpdateStepMutation,
  useDeleteStepMutation,
  type AdminCareer,
} from '@/hooks/queries/adminQueries'
import type { CareerUpsertPayload, StepPayload, UniversityProgram } from '@/api/careers.api'

// ── Helpers ──────────────────────────────────────────────────────────────────

const emptyCareer = (): CareerUpsertPayload & { id?: string } => ({
  title: '',
  description: '',
  sector: '',
  streamCodes: [],
  combinations: [],
  pathwayCodes: [],
  universityPrograms: [],
  keySkills: [],
})

const emptyStep = (): StepPayload => ({ order: 1, title: '', detail: '', timeframe: '' })

const emptyProgram = (): UniversityProgram => ({
  program: '',
  institutions: [],
  entryRequirements: '',
  durationYears: undefined,
  indicativeCostRwf: undefined,
})

// ── Sub-components ────────────────────────────────────────────────────────────

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const trimmed = draft.trim()
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed])
    setDraft('')
  }
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">{label}</label>
      <div className="flex flex-wrap gap-1 mb-1">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border border-border rounded px-2 py-1 text-sm bg-surface text-primary"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder ?? 'Type and press Enter'}
        />
        <button type="button" onClick={add} className="text-xs bg-accent text-white px-2 py-1 rounded">Add</button>
      </div>
    </div>
  )
}

function UniversityProgramsEditor({
  programs,
  onChange,
}: {
  programs: UniversityProgram[]
  onChange: (p: UniversityProgram[]) => void
}) {
  const update = (i: number, patch: Partial<UniversityProgram>) => {
    const next = [...programs]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-muted">University Programs</label>
      {programs.map((p, i) => (
        <div key={i} className="border border-border rounded p-3 space-y-2 bg-background">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-primary">Program {i + 1}</span>
            <button type="button" onClick={() => onChange(programs.filter((_, j) => j !== i))} className="text-error">
              <Trash2 size={14} />
            </button>
          </div>
          <input
            className="w-full border border-border rounded px-2 py-1 text-sm bg-surface text-primary"
            placeholder="Program name"
            value={p.program}
            onChange={(e) => update(i, { program: e.target.value })}
          />
          <input
            className="w-full border border-border rounded px-2 py-1 text-sm bg-surface text-primary"
            placeholder="Entry requirements"
            value={p.entryRequirements ?? ''}
            onChange={(e) => update(i, { entryRequirements: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              type="number"
              className="flex-1 border border-border rounded px-2 py-1 text-sm bg-surface text-primary"
              placeholder="Duration (yrs)"
              value={p.durationYears ?? ''}
              onChange={(e) => update(i, { durationYears: e.target.value ? Number(e.target.value) : undefined })}
            />
            <input
              type="number"
              className="flex-1 border border-border rounded px-2 py-1 text-sm bg-surface text-primary"
              placeholder="Cost (RWF)"
              value={p.indicativeCostRwf ?? ''}
              onChange={(e) => update(i, { indicativeCostRwf: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...programs, emptyProgram()])}
        className="text-xs text-accent border border-accent/30 px-3 py-1 rounded hover:bg-accent/5"
      >
        + Add program
      </button>
    </div>
  )
}

function RoadmapStepsEditor({ career }: { career: AdminCareer }) {
  const addStep = useAddStepMutation()
  const updateStep = useUpdateStepMutation()
  const deleteStep = useDeleteStepMutation()
  const [draft, setDraft] = useState<StepPayload | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<StepPayload & { id: string }>>({})

  const steps = career.roadmapSteps ?? []

  const handleAdd = () => {
    if (!draft) return
    addStep.mutate(
      { careerId: career.id!, payload: { ...draft, order: steps.length + 1 } },
      { onSuccess: () => setDraft(null) },
    )
  }

  const handleUpdate = () => {
    if (!editingId) return
    updateStep.mutate(
      { careerId: career.id!, stepId: editingId, payload: editDraft },
      { onSuccess: () => { setEditingId(null); setEditDraft({}) } },
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muted">Roadmap Steps</label>
      {steps.map((s, i) => (
        <div key={i} className="border border-border rounded p-3 bg-background space-y-1">
          {editingId === (s as { id?: string }).id ? (
            <div className="space-y-2">
              <input
                className="w-full border border-border rounded px-2 py-1 text-sm bg-surface text-primary"
                placeholder="Title"
                value={editDraft.title ?? s.title}
                onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
              />
              <textarea
                className="w-full border border-border rounded px-2 py-1 text-sm bg-surface text-primary"
                rows={2}
                placeholder="Detail"
                value={editDraft.detail ?? s.detail}
                onChange={(e) => setEditDraft((d) => ({ ...d, detail: e.target.value }))}
              />
              <input
                className="w-full border border-border rounded px-2 py-1 text-sm bg-surface text-primary"
                placeholder="Timeframe (e.g. Now – S6)"
                value={editDraft.timeframe ?? (s.timeframe ?? '')}
                onChange={(e) => setEditDraft((d) => ({ ...d, timeframe: e.target.value }))}
              />
              <div className="flex gap-2">
                <button type="button" onClick={handleUpdate} className="text-xs bg-success text-white px-3 py-1 rounded">
                  Save
                </button>
                <button type="button" onClick={() => { setEditingId(null); setEditDraft({}) }} className="text-xs text-muted">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-primary">
                  {s.order}. {s.title}
                </p>
                <p className="text-xs text-muted">{s.detail}</p>
                {s.timeframe && <p className="text-xs text-accent mt-0.5">{s.timeframe}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => { setEditingId((s as { id?: string }).id ?? null); setEditDraft({}) }}
                  className="text-accent"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteStep.mutate({ careerId: career.id!, stepId: (s as { id?: string }).id! })}
                  className="text-error"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {draft ? (
        <div className="border border-border rounded p-3 bg-background space-y-2">
          <input
            className="w-full border border-border rounded px-2 py-1 text-sm bg-surface text-primary"
            placeholder="Step title"
            value={draft.title}
            onChange={(e) => setDraft((d) => d && { ...d, title: e.target.value })}
          />
          <textarea
            className="w-full border border-border rounded px-2 py-1 text-sm bg-surface text-primary"
            rows={2}
            placeholder="Step detail"
            value={draft.detail}
            onChange={(e) => setDraft((d) => d && { ...d, detail: e.target.value })}
          />
          <input
            className="w-full border border-border rounded px-2 py-1 text-sm bg-surface text-primary"
            placeholder="Timeframe (optional)"
            value={draft.timeframe ?? ''}
            onChange={(e) => setDraft((d) => d && { ...d, timeframe: e.target.value })}
          />
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} className="text-xs bg-success text-white px-3 py-1 rounded">
              Add step
            </button>
            <button type="button" onClick={() => setDraft(null)} className="text-xs text-muted">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDraft(emptyStep())}
          className="text-xs text-accent border border-accent/30 px-3 py-1 rounded hover:bg-accent/5"
        >
          + Add step
        </button>
      )}
    </div>
  )
}

// ── Career drawer ─────────────────────────────────────────────────────────────

function CareerDrawer({
  initial,
  onClose,
}: {
  initial: (CareerUpsertPayload & { id?: string; roadmapSteps?: AdminCareer['roadmapSteps'] }) | null
  onClose: () => void
}) {
  const isEdit = !!initial?.id
  const createCareer = useCreateCareerMutation()
  const updateCareer = useUpdateCareerMutation()

  const [form, setForm] = useState<CareerUpsertPayload>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    sector: initial?.sector ?? '',
    streamCodes: initial?.streamCodes ?? [],
    combinations: initial?.combinations ?? [],
    pathwayCodes: initial?.pathwayCodes ?? [],
    universityPrograms: (initial?.universityPrograms as UniversityProgram[]) ?? [],
    keySkills: initial?.keySkills ?? [],
  })

  const set = <K extends keyof CareerUpsertPayload>(key: K, value: CareerUpsertPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit && initial?.id) {
      updateCareer.mutate({ id: initial.id, payload: form }, { onSuccess: onClose })
    } else {
      createCareer.mutate(form, { onSuccess: onClose })
    }
  }

  const pending = createCareer.isPending || updateCareer.isPending

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="w-full max-w-xl bg-surface h-full overflow-y-auto shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface z-10">
          <h2 className="text-base font-semibold text-primary">{isEdit ? 'Edit Career' : 'New Career'}</h2>
          <button onClick={onClose} className="text-muted hover:text-primary">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4">
          {/* Basic fields */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Title *</label>
            <input
              required
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-primary"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Sector *</label>
            <input
              required
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-primary"
              value={form.sector}
              onChange={(e) => set('sector', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Description *</label>
            <textarea
              required
              rows={3}
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-primary"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {/* Stream picker */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Streams *</label>
            <div className="flex gap-2 flex-wrap">
              {STREAM_CODES.map((code) => {
                const selected = form.streamCodes.includes(code)
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() =>
                      set(
                        'streamCodes',
                        selected ? form.streamCodes.filter((s) => s !== code) : [...form.streamCodes, code],
                      )
                    }
                    className={`text-xs px-3 py-1 rounded-full border transition ${
                      selected
                        ? 'bg-accent text-white border-accent'
                        : 'border-border text-muted hover:border-accent'
                    }`}
                  >
                    {STREAM_MAP[code].name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Key skills */}
          <TagInput
            label="Key Skills"
            values={form.keySkills ?? []}
            onChange={(v) => set('keySkills', v)}
            placeholder="e.g. Biology"
          />

          {/* University programs */}
          <UniversityProgramsEditor
            programs={(form.universityPrograms as UniversityProgram[]) ?? []}
            onChange={(p) => set('universityPrograms', p)}
          />

          {/* Legacy combinations */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Legacy Combinations <span className="text-warning text-xs">(legacy — will retire)</span>
            </label>
            <TagInput
              label=""
              values={form.combinations ?? []}
              onChange={(v) => set('combinations', v)}
              placeholder="e.g. PCM"
            />
          </div>

          {/* Roadmap steps (edit mode only) */}
          {isEdit && initial?.id && (
            <RoadmapStepsEditor career={{ id: initial.id, title: form.title, description: form.description, sector: form.sector, streamCodes: form.streamCodes, combinations: form.combinations ?? [], pathwayCodes: form.pathwayCodes ?? [], keySkills: form.keySkills ?? [], universityPrograms: form.universityPrograms ?? [], roadmapSteps: initial.roadmapSteps ?? [], isActive: true, createdAt: '' }} />
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={pending}
              className="w-full bg-accent text-white rounded py-2 text-sm font-medium disabled:opacity-50"
            >
              {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Career'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminCareers() {
  const { data: careers = [], isLoading } = useAdminCareersQuery()
  const toggleCareer = useToggleCareerMutation()
  const deleteCareer = useDeleteCareerMutation()

  const [drawerItem, setDrawerItem] = useState<(CareerUpsertPayload & { id?: string; roadmapSteps?: AdminCareer['roadmapSteps'] }) | null | 'new'>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = careers.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.sector.toLowerCase().includes(search.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-border rounded-xl h-16" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-primary">Career Library</h1>
          <p className="text-sm text-muted mt-0.5">
            {careers.length} careers · {careers.filter((c) => c.isActive).length} active
          </p>
        </div>
        <button
          onClick={() => setDrawerItem('new')}
          className="flex items-center justify-center gap-2 bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium w-full sm:w-auto shrink-0"
        >
          <Plus size={16} /> New Career
        </button>
      </div>

      {/* Search */}
      <input
        className="w-full max-w-xs border border-border rounded-lg px-3 py-2 text-sm bg-surface text-primary"
        placeholder="Search by title or sector…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-background border-b border-border text-muted text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Career</th>
              <th className="text-left px-4 py-3 font-medium">Sector</th>
              <th className="text-left px-4 py-3 font-medium">Streams</th>
              <th className="text-left px-4 py-3 font-medium">Steps</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-muted">
                  No careers found.
                </td>
              </tr>
            )}
            {filtered.map((career) => (
              <>
                <tr key={career.id} className="hover:bg-background transition">
                  <td className="px-4 py-3 max-w-[220px]">
                    <div className="font-medium text-primary truncate">{career.title}</div>
                    <div className="text-xs text-muted line-clamp-1">{career.description}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">{career.sector}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {career.streamCodes.length === 0 ? (
                        <span className="text-xs text-warning">Untagged</span>
                      ) : (
                        career.streamCodes.map((s) => (
                          <span key={s} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                            {STREAM_MAP[s as keyof typeof STREAM_MAP]?.name ?? s}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">
                    {career.roadmapSteps?.length ?? 0} steps
                    {!career.roadmapSteps?.length && (
                      <span className="ml-1 text-warning">⚠ missing</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        career.isActive ? 'bg-success/10 text-success' : 'bg-border text-muted'
                      }`}
                    >
                      {career.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        title="Expand steps"
                        onClick={() => setExpandedId(expandedId === career.id ? null : career.id!)}
                        className="text-muted hover:text-primary"
                      >
                        {expandedId === career.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                      <button
                        title="Edit"
                        onClick={() => setDrawerItem({ id: career.id, title: career.title, description: career.description, sector: career.sector, streamCodes: career.streamCodes, combinations: career.combinations, pathwayCodes: career.pathwayCodes, keySkills: career.keySkills, universityPrograms: career.universityPrograms ?? undefined, roadmapSteps: career.roadmapSteps })}
                        className="text-accent hover:opacity-80"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        title={career.isActive ? 'Deactivate' : 'Activate'}
                        onClick={() => toggleCareer.mutate(career.id!)}
                        className="text-muted hover:text-primary"
                      >
                        {career.isActive ? <ToggleRight size={16} className="text-success" /> : <ToggleLeft size={16} />}
                      </button>
                      <button
                        title="Delete"
                        onClick={() => {
                          if (window.confirm(`Delete "${career.title}"? This cannot be undone.`)) {
                            deleteCareer.mutate(career.id!)
                          }
                        }}
                        className="text-error hover:opacity-80"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === career.id && (
                  <tr>
                    <td colSpan={6} className="bg-background px-6 py-4">
                      <RoadmapStepsEditor career={career} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {drawerItem !== null && (
        <CareerDrawer
          initial={drawerItem === 'new' ? emptyCareer() : drawerItem}
          onClose={() => setDrawerItem(null)}
        />
      )}
    </div>
  )
}
