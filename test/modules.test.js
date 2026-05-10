import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from './helpers/app.js'
import { connect, clearDatabase, closeDatabase } from './helpers/db.js'
import Modules from '../models/modules.js'

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

const validModule = {
  title: '測試模組',
  imageUrl: 'https://example.com/img.png',
  description: '測試說明文字',
  category: '前端基礎技術',
  visible: true,
}

// ─── GET /modules ─────────────────────────────────────────────

describe('GET /modules - 前台列表', () => {
  it('200 - 只回傳 visible:true 的模組', async () => {
    await Modules.create([
      { ...validModule, title: '模組一' },
      { ...validModule, title: '模組二', visible: false },
    ])

    const res = await request(app).get('/modules')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.modules).toHaveLength(1)
    expect(res.body.modules[0].title).toBe('模組一')
  })

  it('200 - 依 sortOrder 排序', async () => {
    await Modules.create([
      { ...validModule, title: '後排序', sortOrder: 2 },
      { ...validModule, title: '先排序', sortOrder: 1 },
    ])

    const res = await request(app).get('/modules')

    expect(res.body.modules[0].title).toBe('先排序')
    expect(res.body.modules[1].title).toBe('後排序')
  })
})

// ─── GET /modules/all ─────────────────────────────────────────

describe('GET /modules/all - 後台全列表', () => {
  it('200 - 回傳所有模組（含未上架）', async () => {
    await Modules.create([
      { ...validModule, title: '上架' },
      { ...validModule, title: '未上架', visible: false },
    ])

    const res = await request(app).get('/modules/all')

    expect(res.status).toBe(200)
    expect(res.body.modules).toHaveLength(2)
  })

  it('403 - 非管理員', async () => {
    vi.mocked(admin).mockImplementationOnce((req, res) => {
      res.status(403).json({ success: false, message: '沒有權限存取此資源' })
    })

    const res = await request(app).get('/modules/all')

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })
})

// ─── POST /modules ────────────────────────────────────────────

describe('POST /modules - 後台新增', () => {
  it('201 - 成功建立模組', async () => {
    const res = await request(app).post('/modules').send(validModule)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.modules.title).toBe(validModule.title)
  })

  it('400 - 缺少必填欄位 title', async () => {
    const { title: _t, ...noTitle } = validModule

    const res = await request(app).post('/modules').send(noTitle)

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('請填寫標題')
  })

  it('400 - category 不合法', async () => {
    const res = await request(app)
      .post('/modules')
      .send({ ...validModule, category: '非法分類' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('403 - 非管理員', async () => {
    vi.mocked(admin).mockImplementationOnce((req, res) => {
      res.status(403).json({ success: false, message: '沒有權限存取此資源' })
    })

    const res = await request(app).post('/modules').send(validModule)

    expect(res.status).toBe(403)
  })
})

// ─── PATCH /modules/:id ───────────────────────────────────────

describe('PATCH /modules/:id - 後台修改', () => {
  it('200 - 成功更新模組標題', async () => {
    const mod = await Modules.create(validModule)

    const res = await request(app)
      .patch(`/modules/${mod._id}`)
      .send({ title: '更新後的標題' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.modules.title).toBe('更新後的標題')
  })

  it('400 - 無效的 ID 格式', async () => {
    const res = await request(app).patch('/modules/invalid-id').send({ title: '更新' })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('無效的MODULES ID')
  })

  it('404 - 模組不存在', async () => {
    const res = await request(app)
      .patch('/modules/000000000000000000000001')
      .send({ title: '更新' })

    expect(res.status).toBe(404)
    expect(res.body.message).toBe('MODULES不存在')
  })

  it('403 - 非管理員', async () => {
    const mod = await Modules.create(validModule)
    vi.mocked(admin).mockImplementationOnce((req, res) => {
      res.status(403).json({ success: false, message: '沒有權限存取此資源' })
    })

    const res = await request(app).patch(`/modules/${mod._id}`).send({ title: '更新' })

    expect(res.status).toBe(403)
  })
})
