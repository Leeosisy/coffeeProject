import { request } from '../../utils/request'

interface BrandItem {
  id: number
  name: string
  logo_url: string | null
  category: string
  sort_order: number
  initial: string
  nameInitial: string
}

interface BrandGroup {
  letter: string
  anchor: string
  brands: BrandItem[]
}

interface BrandListData {
  indexLetters: string[]
  groups: BrandGroup[]
  list: BrandItem[]
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

Page({
  data: {
    loading: true,
    keyword: '',
    selectedBrandId: 0,
    indexLetters: [] as string[],
    groups: [] as BrandGroup[],
    displayGroups: [] as BrandGroup[],
    letterEnabled: {} as Record<string, boolean>,
    scrollIntoView: '',
    activeLetter: '',
    toastLetter: '',
  },

  onLoad(query: Record<string, string | undefined>) {
    const selectedBrandId = query.brandId ? Number(query.brandId) : 0
    this.setData({ selectedBrandId })
    this.loadBrands()
  },

  onUnload() {
    if (toastTimer) {
      clearTimeout(toastTimer)
      toastTimer = null
    }
  },

  async loadBrands() {
    this.setData({ loading: true })
    try {
      const resp = await request<BrandListData>({
        url: '/api/brands',
        method: 'GET',
      })
      if (resp.code !== 200 || !resp.data) {
        throw new Error(resp.msg || '加载失败')
      }

      const groups = resp.data.groups || []
      const indexLetters = resp.data.indexLetters || []
      const letterEnabled: Record<string, boolean> = {}
      indexLetters.forEach((letter) => {
        letterEnabled[letter] = false
      })
      groups.forEach((g) => {
        letterEnabled[g.letter] = true
      })

      this.setData({
        groups,
        indexLetters,
        letterEnabled,
        displayGroups: groups,
        activeLetter: groups.length ? groups[0].letter : '',
      })
    } catch (err) {
      const message = err && (err as Error).message ? (err as Error).message : '加载失败'
      wx.showToast({ title: message, icon: 'none' })
      this.setData({ groups: [], displayGroups: [] })
    } finally {
      this.setData({ loading: false })
    }
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    const keyword = (e.detail.value || '').trim()
    this.setData({ keyword })
    this.filterGroups(keyword)
  },

  filterGroups(keyword: string) {
    const { groups } = this.data
    if (!keyword) {
      const letterEnabled: Record<string, boolean> = {}
      this.data.indexLetters.forEach((letter) => {
        letterEnabled[letter] = false
      })
      groups.forEach((g) => {
        letterEnabled[g.letter] = true
      })
      this.setData({
        displayGroups: groups,
        letterEnabled,
        activeLetter: groups.length ? groups[0].letter : '',
      })
      return
    }

    const lower = keyword.toLowerCase()
    const displayGroups: BrandGroup[] = []
    const letterEnabled: Record<string, boolean> = {}
    this.data.indexLetters.forEach((letter) => {
      letterEnabled[letter] = false
    })

    groups.forEach((group) => {
      const brands = group.brands.filter((item) => {
        return item.name.toLowerCase().indexOf(lower) !== -1
      })
      if (brands.length) {
        displayGroups.push({
          letter: group.letter,
          anchor: group.anchor,
          brands,
        })
        letterEnabled[group.letter] = true
      }
    })

    this.setData({
      displayGroups,
      letterEnabled,
      activeLetter: displayGroups.length ? displayGroups[0].letter : '',
    })
  },

  onTapLetter(e: WechatMiniprogram.TouchEvent) {
    const letter = e.currentTarget.dataset.letter as string
    if (!this.data.letterEnabled[letter]) return

    const anchor = `letter-${letter === '#' ? 'hash' : letter}`
    this.setData({
      scrollIntoView: anchor,
      activeLetter: letter,
      toastLetter: letter,
    })

    if (toastTimer) {
      clearTimeout(toastTimer)
    }
    toastTimer = setTimeout(() => {
      this.setData({ toastLetter: '' })
      toastTimer = null
    }, 500)
  },

  onSelectBrand(e: WechatMiniprogram.TouchEvent) {
    const id = Number(e.currentTarget.dataset.id)
    const name = (e.currentTarget.dataset.name as string) || ''
    const logo = (e.currentTarget.dataset.logo as string) || ''
    this.emitSelect({ id, name, logo })
  },

  onUseCustom() {
    const name = (this.data.keyword || '').trim()
    if (!name) return
    this.emitSelect({ id: 0, name, logo: '' })
  },

  emitSelect(payload: { id: number; name: string; logo: string }) {
    try {
      const eventChannel = this.getOpenerEventChannel()
      eventChannel.emit('selectBrand', payload)
    } catch (_e) {
      // ignore
    }
    wx.navigateBack()
  },
})