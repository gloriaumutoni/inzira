import { useState } from 'react'
import { Building2, Users, UserCheck, X } from 'lucide-react'
import { toast } from '@/utils/toast'
import {
  useSchoolsQuery,
  useAddSchoolMutation,
  useAssignCareerGuideMutation,
  useDeactivateSchoolMutation,
  type School,
} from '@/hooks/queries/adminQueries'

const DISTRICTS = ['Gasabo', 'Nyarugenge', 'Kicukiro', 'Other']

interface AddSchoolForm {
  name: string
  district: string
}

interface AssignForm {
  email: string
}

const AdminSchools = () => {
  const { data: schools = [], isLoading: loading, isError: error } = useSchoolsQuery()
  const addSchoolMutation = useAddSchoolMutation()
  const assignCareerGuideMutation = useAssignCareerGuideMutation()
  const deactivateSchoolMutation = useDeactivateSchoolMutation()
  const [selected, setSelected] = useState<School | null>(null)
  const [districtFilter, setDistrictFilter] = useState<'all' | 'hasGuide'>('all')

  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState<AddSchoolForm>({ name: '', district: 'Gasabo' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignSchoolId, setAssignSchoolId] = useState<string | null>(null)
  const [assignSchoolName, setAssignSchoolName] = useState('')
  const [assignForm, setAssignForm] = useState<AssignForm>({ email: '' })
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState('')

  const [deactivating, setDeactivating] = useState<string | null>(null)

  const openAssign = (school: School) => {
    setAssignSchoolId(school.id)
    setAssignSchoolName(school.name)
    setAssignForm({ email: '' })
    setAssignError('')
    setShowAssignModal(true)
  }

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.name.trim()) return
    setAddLoading(true)
    setAddError('')
    try {
      await addSchoolMutation.mutateAsync({ name: addForm.name.trim(), district: addForm.district })
      setShowAddModal(false)
      setAddForm({ name: '', district: 'Gasabo' })
      toast.success('School added successfully.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add school'
      setAddError(msg)
      toast.error('Action failed. Please try again.')
    } finally {
      setAddLoading(false)
    }
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignForm.email.trim() || !assignSchoolId) return
    setAssignLoading(true)
    setAssignError('')
    try {
      await assignCareerGuideMutation.mutateAsync({ schoolId: assignSchoolId, email: assignForm.email.trim() })
      if (selected?.id === assignSchoolId) {
        setSelected(null)
      }
      setShowAssignModal(false)
      toast.success('Career guide assigned.')
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to assign career guide'
      setAssignError(msg)
      toast.error('Action failed. Please try again.')
    } finally {
      setAssignLoading(false)
    }
  }

  const handleDeactivate = async (school: School) => {
    if (!window.confirm(`Deactivate ${school.name}? Students will no longer be associated with it.`)) return
    setDeactivating(school.id)
    try {
      await deactivateSchoolMutation.mutateAsync(school.id)
      if (selected?.id === school.id) setSelected(null)
      toast.success('School deactivated.')
    } catch {
      toast.error('Action failed. Please try again.')
    } finally {
      setDeactivating(null)
    }
  }

  const displayList = schools.filter((s) =>
    districtFilter === 'hasGuide' ? s.careerGuide !== null : true,
  )
  const totalStudents = schools.reduce((sum, s) => sum + s.studentCount, 0)
  const withGuide = schools.filter((s) => s.careerGuide !== null).length
  const guidePct = schools.length > 0 ? Math.round((withGuide / schools.length) * 100) : 0

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary">Partner Schools</h1>
          <p className="text-sm text-muted mt-1">Manage the schools on Inzira and their Career Guides.</p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setAddError('') }}
          className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 self-start sm:self-auto"
        >
          + Add school
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {[
          { Icon: Building2, label: 'Partner Schools', value: loading ? '—' : schools.length },
          { Icon: Users, label: 'Students Registered', value: loading ? '—' : totalStudents.toLocaleString() },
          { Icon: UserCheck, label: 'Schools with Career Guide', value: loading ? '—' : `${guidePct}%` },
        ].map(({ Icon, label, value }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Icon size={18} className="text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{value}</p>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Schools directory */}
        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-base font-semibold text-primary">Schools Directory</h2>
            <div className="flex gap-2">
              {(['all', 'hasGuide'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setDistrictFilter(f)}
                  className={`text-xs px-3 py-1 rounded-full ${
                    districtFilter === f
                      ? 'bg-primary text-white'
                      : 'border border-border text-muted hover:text-primary'
                  }`}
                >
                  {f === 'all' ? 'All Schools' : 'Has Guide'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border overflow-hidden mt-4">
            {loading ? (
              <div className="space-y-0 p-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-border h-10 rounded mb-2" />
                ))}
              </div>
            ) : error ? (
              <p className="text-sm text-muted p-5">Unable to load schools.</p>
            ) : displayList.length === 0 ? (
              <p className="text-sm text-muted p-5">No partner schools yet. Add the first school.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-background border-b border-border">
                      {['School Name', 'District', 'Career Guide', 'Students', 'Status'].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs font-semibold text-muted uppercase px-5 py-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayList.map((school) => (
                      <tr
                        key={school.id}
                        onClick={() => setSelected(school.id === selected?.id ? null : school)}
                        className={`border-b border-border cursor-pointer transition-colors ${
                          selected?.id === school.id ? 'bg-accent/5' : 'hover:bg-background'
                        }`}
                      >
                        <td className="px-5 py-3 text-sm font-semibold text-primary">{school.name}</td>
                        <td className="px-5 py-3 text-sm text-muted">{school.district}</td>
                        <td className="px-5 py-3 text-sm">
                          {school.careerGuide ? (
                            <span className="text-accent">
                              {school.careerGuide.firstName} {school.careerGuide.lastName}
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-subtle italic">Unassigned</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); openAssign(school) }}
                                className="text-xs text-accent hover:underline"
                              >
                                Assign
                              </button>
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-sm text-primary">{school.studentCount}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              school.isActive
                                ? 'bg-success/10 text-success'
                                : 'bg-border text-muted'
                            }`}
                          >
                            {school.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="bg-surface rounded-xl border border-border p-5 h-fit">
          {!selected ? (
            <p className="text-sm text-muted">Select a school to see details.</p>
          ) : (
            <>
              <p className="text-base font-bold text-primary">{selected.name}</p>
              <p className="text-xs text-muted mt-0.5">{selected.district}</p>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <p className="text-xl font-bold text-primary">{selected.studentCount}</p>
                  <p className="text-xs text-muted">Students</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-primary">—</p>
                  <p className="text-xs text-muted">Engagement</p>
                </div>
              </div>

              <p className="text-xs font-semibold text-muted uppercase tracking-wide mt-5">
                Career Guide Assignment
              </p>
              {selected.careerGuide ? (
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-bold">
                    {selected.careerGuide.firstName[0]}{selected.careerGuide.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">
                      {selected.careerGuide.firstName} {selected.careerGuide.lastName}
                    </p>
                    <p className="text-xs text-muted truncate">{selected.careerGuide.email}</p>
                  </div>
                  <button
                    onClick={() => openAssign(selected)}
                    className="text-xs text-accent hover:underline flex-shrink-0"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-sm text-muted">No guide assigned</p>
                  <button
                    onClick={() => openAssign(selected)}
                    className="text-xs text-accent hover:underline mt-1"
                  >
                    Assign guide →
                  </button>
                </div>
              )}

              <button
                onClick={() => setSelected({ ...selected })}
                className="w-full border border-border text-primary py-2 rounded-lg text-sm hover:bg-background mt-5"
              >
                Edit school details
              </button>
              <button
                onClick={() => handleDeactivate(selected)}
                disabled={deactivating === selected.id || !selected.isActive}
                className="w-full border border-error text-error py-2 rounded-lg text-sm hover:bg-error/5 mt-2 disabled:opacity-50"
              >
                {deactivating === selected.id ? 'Deactivating…' : 'Deactivate school'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add School Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-primary">Add School</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-primary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSchool} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted block mb-1">School Name *</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g. Kigali Parents School"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">District</label>
                <select
                  value={addForm.district}
                  onChange={(e) => setAddForm((f) => ({ ...f, district: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {addError && <p className="text-error text-sm">{addError}</p>}
              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-muted border border-border rounded-lg hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary/90 disabled:opacity-60"
                >
                  {addLoading ? 'Adding…' : 'Add School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Career Guide Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg font-bold text-primary">Assign Career Guide</h2>
              <button onClick={() => setShowAssignModal(false)} className="text-muted hover:text-primary">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-muted mb-4">{assignSchoolName}</p>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <input
                  type="email"
                  required
                  value={assignForm.email}
                  onChange={(e) => setAssignForm({ email: e.target.value })}
                  placeholder="Career guide's email address"
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-muted mt-1">
                  The career guide must have already created an account on Inzira.
                </p>
              </div>
              {assignError && <p className="text-error text-sm">{assignError}</p>}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-sm text-muted border border-border rounded-lg hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading}
                  className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary/90 disabled:opacity-60"
                >
                  {assignLoading ? 'Assigning…' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSchools
