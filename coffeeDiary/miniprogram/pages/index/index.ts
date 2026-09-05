import { formatDate } from '../../utils/calendar'
import { ensureLogin, getStoredUser, isLoggedIn } from '../../utils/auth'
import { request } from '../../utils/request'

interface CoffeeRecord {
  id: number
  user_id: string
  record_date: string
  brand: string | null
  coffee_name: string
  image_url: string | null
  capacity: string | null
  sweetness: string | null
  ice_level: string | null
  rating: number | null
  price: string | number | null
}

const getDateLabel = (dateStr: string) => {
  const today = formatDate(new Date())
  if (dateStr === today) return '今天'

  const date = new Date(dateStr.replace(/-/g, '/'))
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === formatDate(yesterday)) return '昨天'

  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const formatRecordDate = (value: string | Date) => {
  if (typeof value === 'string') {
    return value.slice(0, 10)
  }
  return formatDate(new Date(value))
}

Page({
  data: {
    selectedDate: formatDate(new Date()),
    dateLabel: '今天',
    todayDay: new Date().getDate(),
    isToday: true,
    records: [] as CoffeeRecord[],
    loadingRecords: false,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    this.loadRecords()
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
    this.loadRecords(today)
  },

  onDateSelect(e: WechatMiniprogram.CustomEvent<{ date: string }>) {
    const { date } = e.detail
    const today = formatDate(new Date())
    this.setData({
      selectedDate: date,
      dateLabel: getDateLabel(date),
      isToday: date === today,
    })
    this.loadRecords(date)
  },

  async loadRecords(date?: string) {
    const recordDate = date || this.data.selectedDate
    const user = getStoredUser()
    if (!user || !user.openid) {
      this.setData({ records: [] })
      return
    }

    this.setData({ loadingRecords: true })
    try {
      const resp = await request<CoffeeRecord[]>({
        url: `/api/coffee-records?user_id=${encodeURIComponent(user.openid)}&record_date=${recordDate}`,
        method: 'GET',
      })
      if (resp.code === 200) {
        const list = (resp.data || []).map((item) => ({
          ...item,
          record_date: formatRecordDate(item.record_date as unknown as string),
        }))
        this.setData({ records: list })
      }
    } catch (_e) {
      // 静默失败，保留空列表
      this.setData({ records: [] })
    } finally {
      this.setData({ loadingRecords: false })
    }
  },

  async onAddRecord() {
    try {
      if (!isLoggedIn()) {
        wx.showLoading({ title: '登录中', mask: true })
        await ensureLogin()
        wx.hideLoading()
      }

      wx.navigateTo({
        url: `/pages/record/record?date=${this.data.selectedDate}`,
      })
    } catch (err) {
      wx.hideLoading()
      const message = err && (err as Error).message ? (err as Error).message : '请先登录'
      wx.showModal({
        title: '需要登录',
        content: message + '，请前往「我的」完善资料并登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/profile/profile' })
          }
        },
      })
    }
  },

  onEditRecord(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({
      url: `/pages/record/record?id=${id}`,
    })
  },
})
