import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface PdfColumn<T> {
  header: string
  accessor: (row: T) => string | number
}

export function exportTableToPdf<T>(opts: {
  title: string
  subtitle?: string
  columns: PdfColumn<T>[]
  rows: T[]
  filename: string
}) {
  const { title, subtitle, columns, rows, filename } = opts
  const doc = new jsPDF()

  doc.setFontSize(14)
  doc.text(title, 14, 15)

  let startY = 22
  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(110)
    doc.text(subtitle, 14, 21)
    startY = 27
  }

  autoTable(doc, {
    startY,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => String(c.accessor(row)))),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [245, 246, 248] },
  })

  doc.save(filename)
}
