import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(function MockJsPDF(this: any) {
    this.setFontSize = vi.fn()
    this.text = vi.fn()
    this.setTextColor = vi.fn()
    this.save = vi.fn()
  }),
}))

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}))

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { exportTableToPdf } from './exportPdf'

describe('exportTableToPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps each column accessor into the autoTable body matrix as strings', () => {
    const rows = [
      { name: 'Ada', sessions: 4 },
      { name: 'Beno', sessions: 0 },
    ]

    exportTableToPdf({
      title: 'Students',
      columns: [
        { header: 'Name', accessor: (r: (typeof rows)[number]) => r.name },
        { header: 'Sessions', accessor: (r: (typeof rows)[number]) => r.sessions },
      ],
      rows,
      filename: 'students.pdf',
    })

    expect(autoTable).toHaveBeenCalledTimes(1)
    const [, options] = (autoTable as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, any]
    expect(options.head).toEqual([['Name', 'Sessions']])
    expect(options.body).toEqual([
      ['Ada', '4'],
      ['Beno', '0'],
    ])
  })

  it('saves the PDF using the given filename', () => {
    exportTableToPdf({
      title: 'Students',
      columns: [{ header: 'Name', accessor: (r: { name: string }) => r.name }],
      rows: [{ name: 'Ada' }],
      filename: 'students.pdf',
    })

    const instance = (jsPDF as unknown as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(instance.save).toHaveBeenCalledWith('students.pdf')
  })
})
