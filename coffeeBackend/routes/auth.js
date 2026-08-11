const express = require('express')
const https = require('https')
const { pool } = require('../config/db')

const router = express.Router()

function code2Session(code) {
  const appid = process.env.WX_APPID
  const secret = process.env.WX_SECRET

  if (!appid || !secret) {
    return Promise.resolve({
      openid: null,
      session_key: null,
      mock: true,
    })
  }

  const url =
    `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}` +
    `&secret=${secret}&js_code=${code}&grant_type=authorization_code`

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let raw = ''
        res.on('data', (chunk) => {
          raw += chunk
        })
        res.on('end', () => {
          try {
            const data = JSON.parse(raw)
            if (data.errcode) {
              reject(new Error(data.errmsg || `微信登录失败: ${data.errcode}`))
              return
            }
            resolve(data)
          } catch (err) {
            reject(err)
          }
        })
      })
      .on('error', reject)
  })
}

router.post('/login', async (req, res) => {
  try {
    const { code, nickname, avatar, openid: cachedOpenid } = req.body || {}

    if (!code && !cachedOpenid) {
      return res.status(400).json({
        code: 400,
        msg: '缺少 code 或 openid',
        data: null,
      })
    }

    let openid = cachedOpenid || null
    let session = { mock: true, openid: null, session_key: null }

    if (code) {
      try {
        session = await code2Session(code)
      } catch (err) {
        console.warn('[auth] code2Session 失败，回退本地登录:', err.message)
        session = { mock: true, openid: null, session_key: null }
      }
    }

    if (!session.mock && session.openid) {
      openid = session.openid
    } else if (!openid) {
      // 本地开发：无 AppID/Secret 或换取失败时生成 mock openid，前端需缓存后回传
      openid = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
    }

    const [existing] = await pool.query(
      'SELECT id, openid, nickname, avatar, create_time, update_time FROM `user` WHERE openid = ? LIMIT 1',
      [openid]
    )

    let user
    if (existing.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO `user` (openid, nickname, avatar) VALUES (?, ?, ?)',
        [openid, nickname || null, avatar || null]
      )
      const [rows] = await pool.query(
        'SELECT id, openid, nickname, avatar, create_time, update_time FROM `user` WHERE id = ?',
        [result.insertId]
      )
      user = rows[0]
    } else {
      const nextNickname =
        nickname !== undefined && nickname !== null && nickname !== ''
          ? nickname
          : existing[0].nickname
      const nextAvatar =
        avatar !== undefined && avatar !== null && avatar !== ''
          ? avatar
          : existing[0].avatar

      await pool.query(
        'UPDATE `user` SET nickname = ?, avatar = ? WHERE openid = ?',
        [nextNickname, nextAvatar, openid]
      )
      const [rows] = await pool.query(
        'SELECT id, openid, nickname, avatar, create_time, update_time FROM `user` WHERE openid = ?',
        [openid]
      )
      user = rows[0]
    }

    res.json({
      code: 200,
      msg: '登录成功',
      data: {
        ...user,
        mock: Boolean(session.mock),
      },
    })
    console.log(
      `[user] 登录成功 id=${user.id} openid=${user.openid} mock=${Boolean(session.mock)}`
    )
  } catch (err) {
    res.status(500).json({
      code: 500,
      msg: '登录失败',
      data: null,
      error: err.message,
    })
  }
})

module.exports = router
