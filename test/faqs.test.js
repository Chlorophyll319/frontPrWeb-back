import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from './helpers/app.js'
import { connect, clearDatabase, closeDatabase } from './helpers/db.js'
import Faqs from '../models/faqs.js'

vi.mock('../middlewares/auth.js', () => ({
  token: vi.fn((req, res, next) => next()),
  admin: vi.fn((req, res, next) => next()),
  login: vi.fn((req, res, next) => next()),
}))

const { token, admin } = await import('../middlewares/auth.js')

beforeAll(async () => {
  await connect()
})

afterAll(async () => {
  await closeDatabase()
})

beforeEach(async () => {
  vi.resetAllMocks()
  vi.mocked(token).mockImplementation((req, res, next) => next())
  vi.mocked(admin).mockImplementation((req, res, next) => next())
  await clearDatabase()
})

const validFaq = {
  question: '這是一個測試問題？',
  answer: '這是測試答案。',
  category: '課程內容',
  visible: true,
}

// ─── GET /faqs ────────────────────────────────────────────────

describe('GET /faqs - 前台列表', () => {
  it('200 - 只回傳 visible:true 的 FAQ', async () => {
    await Faqs.create([
      { ...validFaq, question: '問題一' },
      { ...validFaq, question: '問題二', visible: false },
    ])

    const res = await request(app).get('/faqs')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.faqs).toHaveLength(1)
    expect(res.body.faqs[0].question).toBe('問題一')
  })

  it('200 - 依 sortOrder 排序', async () => {
    await Faqs.create([
      { ...validFaq, question: '後排序', sortOrder: 2 },
      { ...validFaq, question: '先排序', sortOrder: 1 },
    ])

    const res = await request(app).get('/faqs')

    expect(res.body.faqs[0].question).toBe('先排序')
    expect(res.body.faqs[1].question).toBe('後排序')
  })
})

// ─── GET /faqs/all ────────────────────────────────────────────

describe('GET /faqs/all - 後台全列表', () => {
  it('200 - 回傳所有 FAQ（含未上架）', async () => {
    await Faqs.create([
      { ...validFaq, question: '上架' },
      { ...validFaq, question: '未上架', visible: false },
    ])

    const res = await request(app).get('/faqs/all')

    expect(res.status).toBe(200)
    expect(res.body.faqs).toHaveLength(2)
  })

  it('403 - 非管理員', async () => {
    vi.mocked(admin).mockImplementationOnce((req, res) => {
      res.status(403).json({ success: false, message: '沒有權限存取此資源' })
    })

    const res = await request(app).get('/faqs/all')

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })
})

// ─── POST /faqs ───────────────────────────────────────────────

describe('POST /faqs - 後台新增', () => {
  it('201 - 成功建立 FAQ', async () => {
    const res = await request(app).post('/faqs').send(validFaq)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.faqs.question).toBe(validFaq.question)
  })

  it('400 - 缺少必填欄位 question', async () => {
    const { question: _q, ...noQuestion } = validFaq

    const res = await request(app).post('/faqs').send(noQuestion)

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('未填寫問題')
  })

  it('400 - category 不合法', async () => {
    const res = await request(app)
      .post('/faqs')
      .send({ ...validFaq, category: '非法分類' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('403 - 非管理員', async () => {
    vi.mocked(admin).mockImplementationOnce((req, res) => {
      res.status(403).json({ success: false, message: '沒有權限存取此資源' })
    })

    const res = await request(app).post('/faqs').send(validFaq)

    expect(res.status).toBe(403)
  })
})

// ─── PATCH /faqs/:id ──────────────────────────────────────────

describe('PATCH /faqs/:id - 後台修改', () => {
  it('200 - 成功更新 FAQ', async () => {
    const faq = await Faqs.create(validFaq)

    const res = await request(app)
      .patch(`/faqs/${faq._id}`)
      .send({ answer: '更新後的答案' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.faqs.answer).toBe('更新後的答案')
  })

  it('400 - 無效的 ID 格式', async () => {
    const res = await request(app).patch('/faqs/invalid-id').send({ answer: '更新' })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('無效的Faqs ID')
  })

  it('404 - FAQ 不存在', async () => {
    const res = await request(app)
      .patch('/faqs/000000000000000000000001')
      .send({ answer: '更新' })

    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Faqs不存在')
  })

  it('403 - 非管理員', async () => {
    const faq = await Faqs.create(validFaq)
    vi.mocked(admin).mockImplementationOnce((req, res) => {
      res.status(403).json({ success: false, message: '沒有權限存取此資源' })
    })

    const res = await request(app).patch(`/faqs/${faq._id}`).send({ answer: '更新' })

    expect(res.status).toBe(403)
  })
})
