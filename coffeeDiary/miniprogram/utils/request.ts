import { BASE_URL } from './config'

export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data: T
  error?: string
}

export function request<T = unknown>(options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: WechatMiniprogram.IAnyObject | string | ArrayBuffer
}): Promise<ApiResponse<T>> {
  const { url, method = 'GET', data } = options
  const fullUrl = url.indexOf('http') === 0 ? url : `${BASE_URL}${url}`

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method,
      data,
      header: {
        'content-type': 'application/json',
      },
      success: (res) => {
        const body = res.data as ApiResponse<T>
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (body && typeof body.code === 'number' && body.code !== 200) {
            reject(new Error(body.msg || '业务处理失败'))
            return
          }
          resolve(body)
          return
        }
        reject(new Error((body && body.msg) || `请求失败(${res.statusCode})`))
      },
      fail: (err) => {
        const tip =
          (err && err.errMsg) ||
          '网络请求失败，请确认后端已启动且 BASE_URL 为电脑局域网 IP'
        reject(new Error(tip))
      },
    })
  })
}
