// demo.ts
interface TestResp {
  code: number
  msg: string
  data: {
    name: string
  }
}

Page({
  data: {
    loading: false,
    resData: null as TestResp | null,
    errorMsg: ""
  },

  fetchData() {
    this.setData({
      loading: true,
      resData: null,
      errorMsg: ""
    })

    wx.request({
      url: "http://127.0.0.1:3000/api/test",
      method: "GET",
      success: (res) => {
        console.log("成功", res)
        if (res.statusCode === 200) {
          this.setData({
            resData: res.data as TestResp
          })
        } else {
          this.setData({
            errorMsg: `状态码${res.statusCode}`
          })
        }
      },
      fail: (err) => {
        console.log("请求失败", err)
        this.setData({
          errorMsg: "请求失败，请确认express后端已经启动"
        })
      },
      complete: () => {
        this.setData({
          loading: false
        })
      }
    })
  }
})
