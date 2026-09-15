import { buildCalendarDays, formatDate, parseDate } from '../../utils/calendar'

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)

const toPickerValue = (year: number, month: number) => `${year}-${pad(month)}`

Component({
  properties: {
    value: {
      type: String,
      value: '',
    },
    markedDates: {
      type: Array,
      value: [] as string[],
    },
  },

  data: {
    year: 0,
    month: 0,
    pickerValue: '',
    selectedDate: '',
    days: [] as ReturnType<typeof buildCalendarDays>,
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
  },

  lifetimes: {
    attached() {
      const today = formatDate(new Date())
      const selectedDate = this.properties.value || today
      const baseDate = parseDate(selectedDate)
      const year = baseDate.getFullYear()
      const month = baseDate.getMonth() + 1

      this.setData({
        year,
        month,
        pickerValue: toPickerValue(year, month),
        selectedDate,
      })
      this.refreshDays()
      this.emitMonthChange(year, month)
    },
  },

  observers: {
    value(val: string) {
      if (!val) return
      const baseDate = parseDate(val)
      const year = baseDate.getFullYear()
      const month = baseDate.getMonth() + 1
      if (
        val === this.data.selectedDate &&
        year === this.data.year &&
        month === this.data.month
      ) {
        return
      }
      const monthChanged = year !== this.data.year || month !== this.data.month
      this.setData({
        selectedDate: val,
        year,
        month,
        pickerValue: toPickerValue(year, month),
      })
      this.refreshDays()
      if (monthChanged) {
        this.emitMonthChange(year, month)
      }
    },
    markedDates() {
      this.refreshDays()
    },
  },

  methods: {
    emitMonthChange(year: number, month: number) {
      this.triggerEvent('monthchange', { year, month })
    },

    goToToday() {
      const today = formatDate(new Date())
      const baseDate = parseDate(today)
      const year = baseDate.getFullYear()
      const month = baseDate.getMonth() + 1
      const monthChanged = year !== this.data.year || month !== this.data.month

      this.setData({
        selectedDate: today,
        year,
        month,
        pickerValue: toPickerValue(year, month),
      })
      this.refreshDays()
      this.triggerEvent('select', { date: today })
      if (monthChanged) {
        this.emitMonthChange(year, month)
      }
    },

    refreshDays() {
      const { year, month, selectedDate } = this.data
      const markedDates = (this.properties.markedDates || []) as string[]
      this.setData({
        days: buildCalendarDays(year, month, selectedDate, markedDates),
      })
    },

    setViewMonth(year: number, month: number) {
      this.setData({
        year,
        month,
        pickerValue: toPickerValue(year, month),
      })
      this.refreshDays()
      this.emitMonthChange(year, month)
    },

    onPrevMonth() {
      let { year, month } = this.data
      month -= 1
      if (month < 1) {
        month = 12
        year -= 1
      }
      this.setViewMonth(year, month)
    },

    onNextMonth() {
      let { year, month } = this.data
      month += 1
      if (month > 12) {
        month = 1
        year += 1
      }
      this.setViewMonth(year, month)
    },

    onMonthChange(e: WechatMiniprogram.PickerChange) {
      const value = e.detail.value as string
      const [year, month] = value.split('-').map(Number)
      this.setViewMonth(year, month)
    },

    onSelectDay(e: WechatMiniprogram.TouchEvent) {
      const date = e.currentTarget.dataset.date as string
      const picked = parseDate(date)
      const year = picked.getFullYear()
      const month = picked.getMonth() + 1
      const monthChanged = year !== this.data.year || month !== this.data.month

      this.setData({
        selectedDate: date,
        year,
        month,
        pickerValue: toPickerValue(year, month),
      })
      this.refreshDays()
      this.triggerEvent('select', { date })
      if (monthChanged) {
        this.emitMonthChange(year, month)
      }
    },
  },
})
