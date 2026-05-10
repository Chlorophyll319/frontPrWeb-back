import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from './helpers/app.js'
import { connect, clearDatabase, closeDatabase } from './helpers/db.js'
import Projects from '../models/projects.js'

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

const validProject = {
  studentName: '王小明',
  title: '測試專案',
  demoUrl: 'https://demo.example.com',
  imageUrl: 'https://example.com/cover.png',
  description: '這是一個測試專案',
  visible: true,
}

// ─── GET /projects ────────────────────────────────────────────

describe('GET /projects - 前台列表', () => {
  it('200 - 只回傳 visible:true 的專案', async () => {
    await Projects.create([
      { ...validProject, title: '專案一' },
      { ...validProject, title: '專案二', visible: false },
    ])

    const res = await request(app).get('/projects')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.projects).toHaveLength(1)
    expect(res.body.projects[0].title).toBe('專案一')
  })

  it('200 - 依 sortOrder 排序', async () => {
    await Projects.create([
      { ...validProject, title: '後排序', sortOrder: 2 },
      { ...validProject, title: '先排序', sortOrder: 1 },
    ])

    const res = await request(app).get('/projects')

    expect(res.body.projects[0].title).toBe('先排序')
    expect(res.body.projects[1].title).toBe('後排序')
  })
})

// ─── GET /projects/all ────────────────────────────────────────

describe('GET /projects/all - 後台全列表', () => {
  it('200 - 回傳所有專案（含未上架）', async () => {
    await Projects.create([
      { ...validProject, title: '上架' },
      { ...validProject, title: '未上架', visible: false },
    ])

    const res = await request(app).get('/projects/all')

    expect(res.status).toBe(200)
    expect(res.body.projects).toHaveLength(2)
  })

  it('403 - 非管理員', async () => {
    vi.mocked(admin).mockImplementationOnce((req, res) => {
      res.status(403).json({ success: false, message: '沒有權限存取此資源' })
    })

    const res = await request(app).get('/projects/all')

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })
})

// ─── POST /projects ───────────────────────────────────────────

describe('POST /projects - 後台新增', () => {
  it('201 - 成功建立專案', async () => {
    const res = await request(app).post('/projects').send(validProject)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.projects.title).toBe(validProject.title)
  })

  it('400 - 缺少必填欄位 demoUrl', async () => {
    const { demoUrl: _d, ...noDemo } = validProject

    const res = await request(app).post('/projects').send(noDemo)

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('請提供精選作品的網址')
  })

  it('403 - 非管理員', async () => {
    vi.mocked(admin).mockImplementationOnce((req, res) => {
      res.status(403).json({ success: false, message: '沒有權限存取此資源' })
    })

    const res = await request(app).post('/projects').send(validProject)

    expect(res.status).toBe(403)
  })
})

// ─── PATCH /projects/:id ──────────────────────────────────────

describe('PATCH /projects/:id - 後台修改', () => {
  it('200 - 成功更新專案標題', async () => {
    const project = await Projects.create(validProject)

    const res = await request(app)
      .patch(`/projects/${project._id}`)
      .send({ title: '更新後的標題' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.projects.title).toBe('更新後的標題')
  })

  it('400 - 無效的 ID 格式', async () => {
    const res = await request(app).patch('/projects/invalid-id').send({ title: '更新' })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('無效的PROJECTS ID')
  })

  it('404 - 專案不存在', async () => {
    const res = await request(app)
      .patch('/projects/000000000000000000000001')
      .send({ title: '更新' })

    expect(res.status).toBe(404)
    expect(res.body.message).toBe('PROJECTS不存在')
  })

  it('403 - 非管理員', async () => {
    const project = await Projects.create(validProject)
    vi.mocked(admin).mockImplementationOnce((req, res) => {
      res.status(403).json({ success: false, message: '沒有權限存取此資源' })
    })

    const res = await request(app).patch(`/projects/${project._id}`).send({ title: '更新' })

    expect(res.status).toBe(403)
  })
})

// ─── DELETE /projects/:id ─────────────────────────────────────

describe('DELETE /projects/:id - 後台刪除', () => {
  it('200 - 成功刪除專案', async () => {
    const project = await Projects.create(validProject)

    const res = await request(app).delete(`/projects/${project._id}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('PROJECTS刪除成功')

    const deleted = await Projects.findById(project._id)
    expect(deleted).toBeNull()
  })

  it('400 - 無效的 ID 格式', async () => {
    const res = await request(app).delete('/projects/invalid-id')

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('無效的PROJECTS ID')
  })

  it('404 - 專案不存在', async () => {
    const res = await request(app).delete('/projects/000000000000000000000001')

    expect(res.status).toBe(404)
    expect(res.body.message).toBe('PROJECTS不存在')
  })

  it('403 - 非管理員', async () => {
    const project = await Projects.create(validProject)
    vi.mocked(admin).mockImplementationOnce((req, res) => {
      res.status(403).json({ success: false, message: '沒有權限存取此資源' })
    })

    const res = await request(app).delete(`/projects/${project._id}`)

    expect(res.status).toBe(403)
  })
})
