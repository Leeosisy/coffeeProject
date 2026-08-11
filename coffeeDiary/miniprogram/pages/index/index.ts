import { formatDate } from '../../utils/calendar'

const getDateLabel = (dateStr: string) => {
  const today = formatDate(new Date())
  if (dateStr === today) return '今天'

  const date = new Date(dateStr.replace(/-/g, '/'))
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === formatDate(yesterday)) return '昨天'

  return `${date.getMonth() + 1}月${date.getDate()}日`
}

Page({
  data: {
    selectedDate: formatDate(new Date()),
    dateLabel: '今天',
    todayDay: new Date().getDate(),
    isToday: true,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  onGoToday() {
    const today = formatDate(new Date())
    this.setData({
      selectedDate: today,
      dateLabel: '今天',
      isToday: true,
      todayDay: new Date().getDate(),
    })

    const calendar = this.selectComponent('.calendar')
    if (calendar) {
      calendar.goToToday()
    }
  },

  onDateSelect(e: WechatMiniprogram.CustomEvent<{ date: string }>) {
    const { date } = e.detail
    const today = formatDate(new Date())
    this.setData({
      selectedDate: date,
      dateLabel: getDateLabel(date),
      isToday: date === today,
    })
  },

  onAddRecord() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
    })
  },
})
