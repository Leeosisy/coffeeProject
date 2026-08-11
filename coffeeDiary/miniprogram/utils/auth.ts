import { request } from './request'

export interface UserInfo {
  id: number
  openid: string
  nickname: string | null
  avatar: string | null
  create_time?: string
  update_time?: string
  mock?: boolean
}

const USER_KEY = 'coffee_user'

export function getStoredUser(): UserInfo | null {
  try {
    return (wx.getStorageSync(USER_KEY) as UserInfo) || null
  } catch (_e) {
    return null
  }
}

export function setStoredUser(user: UserInfo) {
  wx.setStorageSync(USER_KEY, user)
}

export function clearStoredUser() {
  wx.removeStorageSync(USER_KEY)
}

export function isLoggedIn(): boolean {
  const user = getStoredUser()
  return Boolean(user && user.openid)
}

function wxLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code)
          return
        }
        reject(new Error('获取登录凭证失败'))
      },
      fail: (err) => reject(new Error(err.errMsg || 'wx.login 失败')),
    })
  })
}

export async function login(options?: {
  nickname?: string
  avatar?: string
}): Promise<UserInfo> {
  const code = await wxLogin()
  const cached = getStoredUser()

  const resp = await request<UserInfo>({
    url: '/api/auth/login',
    method: 'POST',
    data: {
      code,
      nickname: options && options.nickname,
      avatar: options && options.avatar,
      openid: cached && cached.openid,
    },
  })

  if (resp.code !== 200 || !resp.data) {
    throw new Error(resp.msg || '登录失败')
  }

  setStoredUser(resp.data)
  return resp.data
}

export async function ensureLogin(): Promise<UserInfo> {
  const cached = getStoredUser()
  if (cached && cached.openid) {
    return cached
  }
  return login()
}
