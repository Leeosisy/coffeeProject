const express = require('express')
const { pool } = require('../config/db')

const router = express.Router()

function parseRatingPrice(rating, price) {
  let ratingValue = null
  if (rating !== undefined && rating !== null && rating !== '') {
    ratingValue = Number(rating)
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return { error: '评分需为 1-5 的整数' }
    }
  }

  let priceValue = null
  if (price !== undefined && price !== null && price !== '') {
    priceValue = Number(price)
    if (Number.isNaN(priceValue) || priceValue < 0) {
      return { error: '价格格式不正确' }
    }
  }

  return { ratingValue, priceValue }
}

function formatRecordDate(value) {
  if (!value) return value
  if (typeof value === 'string') return value.slice(0, 10)
  return value
}

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

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) {
      return res.status(400).json({
        code: 400,
        msg: '无效的记录 ID',
        data: null,
      })
    }

    const [rows] = await pool.query(
      'SELECT * FROM coffee_record WHERE id = ? LIMIT 1',
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({
        code: 404,
        msg: '记录不存在',
        data: null,
      })
    }

    const record = rows[0]
    record.record_date = formatRecordDate(record.record_date)

    res.json({
      code: 200,
      msg: '查询成功',
      data: record,
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

    const parsed = parseRatingPrice(rating, price)
    if (parsed.error) {
      return res.status(400).json({
        code: 400,
        msg: parsed.error,
        data: null,
      })
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
        parsed.ratingValue,
        parsed.priceValue,
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

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) {
      return res.status(400).json({
        code: 400,
        msg: '无效的记录 ID',
        data: null,
      })
    }

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

    if (!record_date || !coffee_name) {
      return res.status(400).json({
        code: 400,
        msg: 'record_date、coffee_name 为必填项',
        data: null,
      })
    }

    const parsed = parseRatingPrice(rating, price)
    if (parsed.error) {
      return res.status(400).json({
        code: 400,
        msg: parsed.error,
        data: null,
      })
    }

    const [existing] = await pool.query(
      'SELECT id, user_id FROM coffee_record WHERE id = ? LIMIT 1',
      [id]
    )
    if (!existing.length) {
      return res.status(404).json({
        code: 404,
        msg: '记录不存在',
        data: null,
      })
    }

    if (user_id && String(existing[0].user_id) !== String(user_id)) {
      return res.status(403).json({
        code: 403,
        msg: '无权编辑该记录',
        data: null,
      })
    }

    await pool.query(
      `UPDATE coffee_record SET
        record_date = ?,
        brand = ?,
        coffee_name = ?,
        image_url = ?,
        capacity = ?,
        sweetness = ?,
        ice_level = ?,
        rating = ?,
        price = ?
       WHERE id = ?`,
      [
        record_date,
        brand || null,
        coffee_name,
        image_url || null,
        capacity || null,
        sweetness || null,
        ice_level || null,
        parsed.ratingValue,
        parsed.priceValue,
        id,
      ]
    )

    console.log(
      `[coffee_record] 已更新 MySQL id=${id} date=${record_date} name=${coffee_name}`
    )

    const [rows] = await pool.query(
      'SELECT * FROM coffee_record WHERE id = ?',
      [id]
    )

    res.json({
      code: 200,
      msg: '更新成功',
      data: rows[0],
    })
  } catch (err) {
    res.status(500).json({
      code: 500,
      msg: '更新失败',
      data: null,
      error: err.message,
    })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!id) {
      return res.status(400).json({
        code: 400,
        msg: '无效的记录 ID',
        data: null,
      })
    }

    const userId = (req.body && req.body.user_id) || req.query.user_id

    const [existing] = await pool.query(
      'SELECT id, user_id FROM coffee_record WHERE id = ? LIMIT 1',
      [id]
    )
    if (!existing.length) {
      return res.status(404).json({
        code: 404,
        msg: '记录不存在',
        data: null,
      })
    }

    if (userId && String(existing[0].user_id) !== String(userId)) {
      return res.status(403).json({
        code: 403,
        msg: '无权删除该记录',
        data: null,
      })
    }

    await pool.query('DELETE FROM coffee_record WHERE id = ?', [id])

    console.log(`[coffee_record] 已删除 MySQL id=${id}`)

    res.json({
      code: 200,
      msg: '删除成功',
      data: { id },
    })
  } catch (err) {
    res.status(500).json({
      code: 500,
      msg: '删除失败',
      data: null,
      error: err.message,
    })
  }
})

module.exports = router
