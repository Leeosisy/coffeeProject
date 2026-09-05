const express = require('express')
const { pinyin } = require('pinyin-pro')
const { pool } = require('../config/db')

const router = express.Router()

const INDEX_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')

function getInitial(name) {
  if (!name || !String(name).trim()) return '#'
  const first = String(name).trim().charAt(0)
  if (/[a-zA-Z]/.test(first)) return first.toUpperCase()
  if (/[0-9]/.test(first)) return '#'

  const py = pinyin(first, {
    pattern: 'first',
    toneType: 'none',
    type: 'string',
  })
  const letter = String(py || '')
    .charAt(0)
    .toUpperCase()
  return /[A-Z]/.test(letter) ? letter : '#'
}

function buildBrandGroups(rows) {
  const map = {}
  INDEX_LETTERS.forEach((letter) => {
    map[letter] = []
  })

  rows.forEach((row) => {
    const initial = getInitial(row.name)
    const item = {
      id: row.id,
      name: row.name,
      logo_url: row.logo_url,
      category: row.category,
      sort_order: row.sort_order,
      initial,
      nameInitial: row.name ? String(row.name).charAt(0) : '?',
    }
    if (!map[initial]) map[initial] = []
    map[initial].push(item)
  })

  INDEX_LETTERS.forEach((letter) => {
    map[letter].sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
      return a.name.localeCompare(b.name, 'zh-CN')
    })
  })

  const groups = INDEX_LETTERS.filter((letter) => map[letter].length > 0).map(
    (letter) => ({
      letter,
      anchor: `letter-${letter === '#' ? 'hash' : letter}`,
      brands: map[letter],
    })
  )

  return {
    indexLetters: INDEX_LETTERS,
    groups,
    list: groups.reduce((acc, g) => acc.concat(g.brands), []),
  }
}

router.get('/', async (req, res) => {
  try {
    const { category } = req.query
    const conditions = ['is_active = 1']
    const params = []

    if (category && category !== 'all') {
      conditions.push('(category = ? OR category = ?)')
      params.push(category, 'both')
    }

    const where = `WHERE ${conditions.join(' AND ')}`
    const [rows] = await pool.query(
      `SELECT id, name, logo_url, category, sort_order
       FROM brand
       ${where}
       ORDER BY sort_order ASC, id ASC`,
      params
    )

    const grouped = buildBrandGroups(rows)

    res.json({
      code: 200,
      msg: '查询成功',
      data: grouped,
    })
  } catch (err) {
    res.status(500).json({
      code: 500,
      msg: '查询品牌失败',
      data: null,
      error: err.message,
    })
  }
})

module.exports = router
