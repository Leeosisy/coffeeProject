export interface CalendarDay {
  day: number
  date: string
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  hasRecord: boolean
}

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)

export const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${pad(month)}-${pad(day)}`
}

export const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const buildCalendarDays = (
  year: number,
  month: number,
  selectedDate: string,
  markedDates: string[] = []
): CalendarDay[] => {
  const todayStr = formatDate(new Date())
  const markedMap: Record<string, boolean> = {}
  markedDates.forEach((d) => {
    markedMap[d] = true
  })

  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const startWeekday = firstDay.getDay()
  const days: CalendarDay[] = []

  const prevMonthLast = new Date(year, month - 1, 0).getDate()
  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = prevMonthLast - i
    const m = month === 1 ? 12 : month - 1
    const y = month === 1 ? year - 1 : year
    const date = `${y}-${pad(m)}-${pad(day)}`
    days.push({
      day,
      date,
      isCurrentMonth: false,
      isToday: date === todayStr,
      isSelected: date === selectedDate,
      hasRecord: Boolean(markedMap[date]),
    })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${pad(month)}-${pad(d)}`
    days.push({
      day: d,
      date,
      isCurrentMonth: true,
      isToday: date === todayStr,
      isSelected: date === selectedDate,
      hasRecord: Boolean(markedMap[date]),
    })
  }

  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const m = month === 12 ? 1 : month + 1
    const y = month === 12 ? year + 1 : year
    const date = `${y}-${pad(m)}-${pad(d)}`
    days.push({
      day: d,
      date,
      isCurrentMonth: false,
      isToday: date === todayStr,
      isSelected: date === selectedDate,
      hasRecord: Boolean(markedMap[date]),
    })
  }

  return days
}
