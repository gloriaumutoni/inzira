import { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '@/api/axios'
import { SECTOR_COLORS } from '@/utils/sectorColors'
import type { CompanyWorkshop } from '@/hooks/useCompanyWorkshops'

interface CreateWorkshopModalProps {
  onClose: () => void
  onSuccess: () => void
  editWorkshop?: CompanyWorkshop | null
}

const today = new Date().toISOString().split('T')[0]

const CreateWorkshopModal = ({ onClose, onSuccess, editWorkshop }: CreateWorkshopModalProps) => {
  const [title, setTitle] = useState(editWorkshop?.title ?? '')
  const [sector, setSector] = useState(editWorkshop?.sector ?? '')
  const [description, setDescription] = useState(editWorkshop?.description ?? '')
  const [date, setDate] = useState(editWorkshop?.date ? editWorkshop.date.split('T')[0] : '')
  const [startTime, setStartTime] = useState(editWorkshop?.startTime ?? '')
  const [endTime, setEndTime] = useState(editWorkshop?.endTime ?? '')
  const [format, setFormat] = useState<'IN_PERSON' | 'ONLINE'>(editWorkshop?.format ?? 'IN_PERSON')
  const [location, setLocation] = useState(editWorkshop?.location ?? '')
  const [capacity, setCapacity] = useState(editWorkshop?.capacity ?? 100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (publishAfter: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        title,
        description,
        sector,
        date: new Date(date).toISOString(),
        startTime,
        endTime,
        format,
        location: format === 'IN_PERSON' ? location : undefined,
        capacity: Number(capacity),
      }

      if (editWorkshop) {
        await api.patch(`/workshops/${editWorkshop.id}`, payload)
      } else {
        const { data } = await api.post('/workshops', payload)
        if (publishAfter) {
          await api.patch(`/workshops/${data.data.id}/publish`)
        }
      }

      onSuccess()
      onClose()
    } catch {
      setError('Could not save workshop. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 py-8"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary">
            {editWorkshop ? 'Edit Workshop' : 'Create a Workshop'}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Workshop Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Cloud Architecture"
              required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder-subtle focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Industry Sector</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent bg-surface"
            >
              <option value="">Select an industry</option>
              {Object.keys(SECTOR_COLORS).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief overview of what students will learn..."
              required
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder-subtle focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">Format</label>
            <div className="flex gap-2">
              {(['IN_PERSON', 'ONLINE'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    format === f
                      ? 'bg-primary text-white'
                      : 'border border-border text-muted hover:border-primary',
                  ].join(' ')}
                >
                  {f === 'IN_PERSON' ? 'In Person' : 'Online'}
                </button>
              ))}
            </div>
          </div>

          {format === 'IN_PERSON' && (
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kigali Convention Centre, Rwanda"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder-subtle focus:outline-none focus:border-accent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-primary mb-1">Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              min={1}
              required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {error && <p className="text-error text-sm mt-2">{error}</p>}

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="border border-border text-primary py-2.5 rounded-lg text-sm font-semibold hover:bg-background disabled:opacity-60 transition-colors"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            Publish Workshop
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateWorkshopModal
