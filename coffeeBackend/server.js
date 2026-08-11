const express = require('express')
const cors = require('cors')
const os = require('os')
require('dotenv').config()
const { testConnection } = require('./config/db')
const authRouter = require('./routes/auth')
const coffeeRouter = require('./routes/coffee')

const app = express()
const port = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json())

app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`)
  next()
})

app.get('/api/test', (req, res) => {
  res.json({
    code: 200,
    msg: '接口测试成功',
    data: { name: 'express后端' },
  })
})

app.use('/api/auth', authRouter)
app.use('/api/coffee-records', coffeeRouter)

function getLanIPs() {
  const nets = os.networkInterfaces()
  const result = []
  Object.keys(nets).forEach((name) => {
    const list = nets[name] || []
    list.forEach((item) => {
      if (item.family === 'IPv4' && !item.internal) {
        result.push(item.address)
      }
    })
  })
  return result
}

async function startServer() {
  try {
    await testConnection()
    console.log('MySQL 连接成功 (coffee_db)')
  } catch (err) {
    console.error('MySQL 连接失败:', err.message)
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`服务启动 http://127.0.0.1:${port}`)
    getLanIPs().forEach((ip) => {
      console.log(`真机预览请用 http://${ip}:${port}`)
    })
  })
}

startServer()
