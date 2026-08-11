import { getStoredUser, login } from '../../utils/auth'

const defaultAvatarUrl =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    avatarUrl: defaultAvatarUrl,
    nickName: '',
    isLoggedIn: false,
    loggingIn: false,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
    this.syncUser()
  },

  syncUser() {
    const user = getStoredUser()
    if (user) {
      this.setData({
        isLoggedIn: true,
        nickName: user.nickname || '',
        avatarUrl: user.avatar || defaultAvatarUrl,
      })
      return
    }
    this.setData({
      isLoggedIn: false,
    })
  },

  onChooseAvatar(e: WechatMiniprogram.CustomEvent<{ avatarUrl: string }>) {
    const avatarUrl = e.detail.avatarUrl
    this.setData({ avatarUrl })
  },

  onNicknameInput(e: WechatMiniprogram.Input) {
    this.setData({ nickName: e.detail.value })
  },

  onNicknameBlur(e: WechatMiniprogram.Input) {
    this.setData({ nickName: (e.detail.value || '').trim() })
  },

  async onLogin() {
    if (this.data.loggingIn) return
    this.setData({ loggingIn: true })

    try {
      const { nickName, avatarUrl } = this.data
      const avatar =
        avatarUrl && avatarUrl !== defaultAvatarUrl && avatarUrl.startsWith('https://')
          ? avatarUrl
          : null

      const user = await login({
        nickname: nickName || undefined,
        avatar: avatar || undefined,
      })

      this.setData({
        isLoggedIn: true,
        nickName: user.nickname || nickName,
        avatarUrl: user.avatar || avatarUrl || defaultAvatarUrl,
      })

      wx.showToast({
        title: '登录成功',
        icon: 'success',
      })
    } catch (err) {
      const message = err && (err as Error).message ? (err as Error).message : '登录失败'
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ loggingIn: false })
    }
  },
})
