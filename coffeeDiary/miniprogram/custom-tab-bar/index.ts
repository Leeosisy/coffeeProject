Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: '☕' },
      { pagePath: '/pages/stats/stats', text: '统计', icon: '📊' },
      { pagePath: '/pages/profile/profile', text: '我的', icon: '👤' },
    ],
  },
  methods: {
    switchTab(e: WechatMiniprogram.TouchEvent) {
      const { path, index } = e.currentTarget.dataset
      wx.switchTab({ url: path })
      this.setData({ selected: index })
    },
  },
})
