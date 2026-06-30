interface TimeTemplate {
  dayOfWeek: number
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
}

export const expandWeeklyTemplate = (
  templates: TimeTemplate[],
  daysAhead: number = 14
): Array<{ start: Date; end: Date }> => {
  const slots: Array<{ start: Date; end: Date }> = []
  const now = new Date()
  const buffer = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  for (let d = 0; d < daysAhead; d++) {
    const date = new Date(now)
    date.setDate(date.getDate() + d)
    const dow = date.getDay()

    for (const template of templates) {
      if (template.dayOfWeek !== dow) continue

      const start = new Date(date)
      start.setHours(template.startHour, template.startMinute, 0, 0)
      const end = new Date(date)
      end.setHours(template.endHour, template.endMinute, 0, 0)

      if (start > buffer) {
        slots.push({ start, end })
      }
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime())
}
