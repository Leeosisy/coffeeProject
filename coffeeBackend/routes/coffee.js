const express = require('express')
const { pool } = require('../config/db')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { user_id, record_date } = req.query
    const conditions = []
    const params = []

    if (user_id) {
      conditions.push('user_id = ?')
      params.push(user_id)
    }
    if (record_date) {
      conditions.push('record_date = ?')
      params.push(record_date)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const [rows] = await pool.query(
      `SELECT * FROM coffee_record ${where} ORDER BY created_at DESC`,
      params
    )

    res.json({
      code: 200,
      msg: '查询成功',
      data: rows,
    })
  } catch (err) {
    res.status(500).json({
      code: 500,
      msg: '查询失败',
      data: null,
      error: err.message,
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      record_date,
      brand,
      coffee_name,
      image_url,
      capacity,
      sweetness,
      ice_level,
      rating,
      price,
    } = req.body || {}

    if (!user_id || !record_date || !coffee_name) {
      return res.status(400).json({
        code: 400,
        msg: 'user_id、record_date、coffee_name 为必填项',
        data: null,
      })
    }

    let ratingValue = null
    if (rating !== undefined && rating !== null && rating !== '') {
      ratingValue = Number(rating)
      if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        return res.status(400).json({
          code: 400,
          msg: '评分需为 1-5 的整数',
          data: null,
        })
      }
    }

    let priceValue = null
    if (price !== undefined && price !== null && price !== '') {
      priceValue = Number(price)
      if (Number.isNaN(priceValue) || priceValue < 0) {
        return res.status(400).json({
          code: 400,
          msg: '价格格式不正确',
          data: null,
        })
      }
    }

    const [result] = await pool.query(
      `INSERT INTO coffee_record
        (user_id, record_date, brand, coffee_name, image_url, capacity, sweetness, ice_level, rating, price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(user_id),
        record_date,
        brand || null,
        coffee_name,
        image_url || null,
        capacity || null,
        sweetness || null,
        ice_level || null,
        ratingValue,
        priceValue,
      ]
    )

    console.log(
      `[coffee_record] 已写入 MySQL id=${result.insertId} user_id=${user_id} date=${record_date} name=${coffee_name}`
    )

    const [rows] = await pool.query(
      'SELECT * FROM coffee_record WHERE id = ?',
      [result.insertId]
    )

    res.json({
      code: 200,
      msg: '保存成功',
      data: rows[0],
    })
  } catch (err) {
    res.status(500).json({
      code: 500,
      msg: '保存失败',
      data: null,
      error: err.message,
    })
  }
})

module.exports = router
