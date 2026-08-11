import { getStoredUser, ensureLogin } from './utils/auth'

App<IAppOption>({
  globalData: {
    userInfo: undefined,
  },
  onLaunch() {
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    const cached = getStoredUser()
    if (cached) {
      this.globalData.userInfo = cached as unknown as WechatMiniprogram.UserInfo
      return
    }

    // 静默尝试登录，失败不影响使用（记录时再提示）
    ensureLogin().catch(() => {
      // ignore
    })
  },
})
