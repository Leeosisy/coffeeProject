import { ensureLogin } from '../../utils/auth'
import { formatDate } from '../../utils/calendar'
import { request } from '../../utils/request'

Page({
  data: {
    recordDate: formatDate(new Date()),
    coffeeName: '',
    brand: '',
    capacity: '',
    sweetness: '',
    iceLevel: '',
    rating: 0,
    price: '',
    imageUrl: '',
    saving: false,
    capacityOptions: ['小杯', '中杯', '大杯', '超大杯'],
    sweetnessOptions: ['无糖', '少糖', '半糖', '正常糖', '全糖'],
    iceOptions: ['热', '去冰', '少冰', '正常冰', '多冰'],
    ratingStars: [1, 2, 3, 4, 5],
  },

  onLoad(query: Record<string, string | undefined>) {
    const date = query.date || formatDate(new Date())
    this.setData({ recordDate: date })
  },

  onCoffeeNameInput(e: WechatMiniprogram.Input) {
    this.setData({ coffeeName: e.detail.value })
  },

  onBrandInput(e: WechatMiniprogram.Input) {
    this.setData({ brand: e.detail.value })
  },

  onPriceInput(e: WechatMiniprogram.Input) {
    this.setData({ price: e.detail.value })
  },

  onSelectCapacity(e: WechatMiniprogram.TouchEvent) {
    const value = e.currentTarget.dataset.value as string
    this.setData({ capacity: this.data.capacity === value ? '' : value })
  },

  onSelectSweetness(e: WechatMiniprogram.TouchEvent) {
    const value = e.currentTarget.dataset.value as string
    this.setData({ sweetness: this.data.sweetness === value ? '' : value })
  },

  onSelectIce(e: WechatMiniprogram.TouchEvent) {
    const value = e.currentTarget.dataset.value as string
    this.setData({ iceLevel: this.data.iceLevel === value ? '' : value })
  },

  onSelectRating(e: WechatMiniprogram.TouchEvent) {
    const value = Number(e.currentTarget.dataset.value)
    this.setData({ rating: this.data.rating === value ? 0 : value })
  },

  onChooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles[0]
        if (file && file.tempFilePath) {
          // 暂存本地临时路径；后续可接入 OSS 后替换为线上地址
          this.setData({ imageUrl: file.tempFilePath })
        }
      },
    })
  },

  onClearImage() {
    this.setData({ imageUrl: '' })
  },

  async onSave() {
    const { coffeeName, recordDate, brand, capacity, sweetness, iceLevel, rating, price, imageUrl, saving } =
      this.data

    if (saving) return

    if (!coffeeName.trim()) {
      wx.showToast({ title: '请填写饮品名称', icon: 'none' })
      return
    }

    this.setData({ saving: true })

    try {
      const user = await ensureLogin()

      // 仅持久化 https 线上地址；本地临时路径待接入 OSS 后再上传
      const persistImage = imageUrl && imageUrl.startsWith('https://') ? imageUrl : null

      const resp = await request({
        url: '/api/coffee-records',
        method: 'POST',
        data: {
          user_id: user.openid,
          record_date: recordDate,
          brand: brand.trim() || null,
          coffee_name: coffeeName.trim(),
          image_url: persistImage,
          capacity: capacity || null,
          sweetness: sweetness || null,
          ice_level: iceLevel || null,
          rating: rating || null,
          price: price || null,
        },
      })

      if (resp.code !== 200) {
        throw new Error(resp.msg || '保存失败')
      }

      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 500)
    } catch (err) {
      const message = err && (err as Error).message ? (err as Error).message : '保存失败'
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },
})
