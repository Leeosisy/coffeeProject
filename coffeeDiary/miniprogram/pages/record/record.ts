import { ensureLogin, getStoredUser } from '../../utils/auth'
import { formatDate } from '../../utils/calendar'
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

Page({
  data: {
    recordId: 0,
    isEdit: false,
    recordDate: formatDate(new Date()),
    coffeeName: '',
    brand: '',
    capacity: '',
    sweetness: '',
    iceLevel: '',
    rating: 0,
    price: '',
    imageUrl: '',
    originalImageUrl: '',
    saving: false,
    deleting: false,
    loading: false,
    capacityOptions: ['小杯', '中杯', '大杯', '超大杯'],
    sweetnessOptions: ['无糖', '少糖', '半糖', '正常糖', '全糖'],
    iceOptions: ['热', '去冰', '少冰', '正常冰', '多冰'],
    ratingStars: [1, 2, 3, 4, 5],
  },

  onLoad(query: Record<string, string | undefined>) {
    const id = query.id ? Number(query.id) : 0
    if (id) {
      this.setData({ recordId: id, isEdit: true })
      wx.setNavigationBarTitle({ title: '编辑记录' })
      this.loadRecord(id)
      return
    }

    const date = query.date || formatDate(new Date())
    this.setData({ recordDate: date, isEdit: false })
    wx.setNavigationBarTitle({ title: '记录咖啡' })
  },

  async loadRecord(id: number) {
    this.setData({ loading: true })
    try {
      const resp = await request<CoffeeRecord>({
        url: `/api/coffee-records/${id}`,
        method: 'GET',
      })
      if (resp.code !== 200 || !resp.data) {
        throw new Error(resp.msg || '加载失败')
      }

      const item = resp.data
      const recordDate =
        typeof item.record_date === 'string'
          ? item.record_date.slice(0, 10)
          : formatDate(new Date(item.record_date))

      this.setData({
        recordDate,
        coffeeName: item.coffee_name || '',
        brand: item.brand || '',
        capacity: item.capacity || '',
        sweetness: item.sweetness || '',
        iceLevel: item.ice_level || '',
        rating: item.rating || 0,
        price: item.price === null || item.price === undefined ? '' : String(item.price),
        imageUrl: item.image_url || '',
        originalImageUrl: item.image_url || '',
      })
    } catch (err) {
      const message = err && (err as Error).message ? (err as Error).message : '加载失败'
      wx.showToast({ title: message, icon: 'none' })
      setTimeout(() => {
        wx.navigateBack()
      }, 800)
    } finally {
      this.setData({ loading: false })
    }
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
          this.setData({ imageUrl: file.tempFilePath })
        }
      },
    })
  },

  onClearImage() {
    this.setData({ imageUrl: '', originalImageUrl: '' })
  },

  onDelete() {
    if (!this.data.isEdit || !this.data.recordId || this.data.deleting) return

    wx.showModal({
      title: '删除记录',
      content: '确定删除这条咖啡记录吗？删除后不可恢复',
      confirmText: '删除',
      confirmColor: '#c45c26',
      success: (res) => {
        if (res.confirm) {
          this.deleteRecord()
        }
      },
    })
  },

  async deleteRecord() {
    const { recordId, deleting } = this.data
    if (deleting) return

    this.setData({ deleting: true })
    wx.showLoading({ title: '删除中', mask: true })

    try {
      const user = getStoredUser() || (await ensureLogin())
      const resp = await request({
        url: `/api/coffee-records/${recordId}?user_id=${encodeURIComponent(user.openid)}`,
        method: 'DELETE',
      })

      if (resp.code !== 200) {
        throw new Error(resp.msg || '删除失败')
      }

      wx.hideLoading()
      wx.showToast({ title: '已删除', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 500)
    } catch (err) {
      wx.hideLoading()
      const message = err && (err as Error).message ? (err as Error).message : '删除失败'
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ deleting: false })
    }
  },

  resolvePersistImage(imageUrl: string, originalImageUrl: string) {
    if (!imageUrl) return null
    if (imageUrl.indexOf('https://') === 0) return imageUrl
    // 编辑时未改图（临时路径不应覆盖原图）
    if (originalImageUrl && originalImageUrl.indexOf('https://') === 0) {
      return originalImageUrl
    }
    return null
  },

  async onSave() {
    const {
      coffeeName,
      recordDate,
      brand,
      capacity,
      sweetness,
      iceLevel,
      rating,
      price,
      imageUrl,
      originalImageUrl,
      saving,
      isEdit,
      recordId,
    } = this.data

    if (saving) return

    if (!coffeeName.trim()) {
      wx.showToast({ title: '请填写饮品名称', icon: 'none' })
      return
    }

    this.setData({ saving: true })

    try {
      const user = await ensureLogin()
      const persistImage = this.resolvePersistImage(imageUrl, originalImageUrl)
      const payload = {
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
      }

      const resp = isEdit
        ? await request({
            url: `/api/coffee-records/${recordId}`,
            method: 'PUT',
            data: payload,
          })
        : await request({
            url: '/api/coffee-records',
            method: 'POST',
            data: payload,
          })

      if (resp.code !== 200) {
        throw new Error(resp.msg || '保存失败')
      }

      wx.showToast({ title: isEdit ? '更新成功' : '保存成功', icon: 'success' })
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
