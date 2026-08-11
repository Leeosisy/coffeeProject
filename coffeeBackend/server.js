const express = require('express')
const cors = require('cors')
const { pool, testConnection } = require('./config/db')

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

app.get('/api/test', (req, res) => {
  res.json({
    code: 200,
    msg: '接口测试成功',
    data: { name: 'express后端' }
  })
})

app.get('/api/coffee-records', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM coffee_record')
    res.json({
      code: 200,
      msg: '查询成功',
      data: rows
    })
  } catch (err) {
    res.status(500).json({
      code: 500,
      msg: '查询失败',
      data: null,
      error: err.message
    })
  }
})

async function startServer() {
  try {
    await testConnection()
    console.log('MySQL 连接成功 (coffee_db.coffee_record)')
  } catch (err) {
    console.error('MySQL 连接失败:', err.message)
  }

  app.listen(port, () => {
    console.log(`服务启动 http://127.0.0.1:${port}`)
  })
}

startServer()
