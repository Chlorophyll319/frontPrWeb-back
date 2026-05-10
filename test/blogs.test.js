import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from './helpers/app.js'
import { connect, clearDatabase, closeDatabase } from './helpers/db.js'
import Blogs from '../models/blogs.js'

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

const validBlog = {
  title: '測試文章標題',
  summary: '這是摘要',
  content: '# 內容\n這是文章內容。',
  tags: '課程相關',
  visible: true,
}

// ─── GET /blogs ───────────────────────────────────────────────

describe('GET /blogs - 前台列表', () => {
  beforeEach(async () => {
    await Blogs.create([
      { ...validBlog, title: '文章一', visible: true },
      { ...validBlog, title: '文章二', visible: true, tags: '學員心得' },
      { ...validBlog, title: '文章三', visible: false },
    ])
  })

  it('200 - 只回傳 visible:true 的文章', async () => {
    const res = await request(app).get('/blogs')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.blogs).toHaveLength(2)
    expect(res.body.total).toBe(2)
    expect(res.body.blogs.every((b) => b.visible)).toBe(true)
  })

  it('200 - tag 篩選', async () => {
    const res = await request(app).get('/blogs?tag=學員心得')

    expect(res.status).toBe(200)
    expect(res.body.blogs).toHaveLength(1)
    expect(res.body.blogs[0].title).toBe('文章二')
  })

  it('200 - 分頁：limit + page', async () => {
    const res = await request(app).get('/blogs?limit=1&page=1')

    expect(res.status).toBe(200)
    expect(res.body.blogs).toHaveLength(1)
    expect(res.body.totalPages).toBe(2)
  })
})

// ─── GET /blogs/all ───────────────────────────────────────────

describe('GET /blogs/all - 後台全列表', () => {
  it('200 - 回傳所有文章（含未上架）', async () => {
    await Blogs.create([
      { ...validBlog, title: '上架中' },
      { ...validBlog, title: '未上架', visible: false },
    ])

    const res = await request(app).get('/blogs/all')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.blogs).toHaveLength(2)
  })

  it('403 - 非管理員', async () => {
    vi.mocked(admin).mockImplementationOnce((req, res) => {
      res.status(403).json({ success: false, message: '沒有權限存取此資源' })
    })

    const res = await request(app).get('/blogs/all')

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })
})

// ─── GET /blogs/:id ───────────────────────────────────────────

describe('GET /blogs/:id - 前台單篇', () => {
  it('200 - 成功取得單篇文章', async () => {
    const blog = await Blogs.create(validBlog)

    const res = await request(app).get(`/blogs/${blog._id}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.blogs._id).toBe(blog._id.toString())
  })

  it('400 - 無效的 ID 格式', async () => {
    const res = await request(app).get('/blogs/invalid-id')

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('無效的BLOGS ID')
  })

  it('404 - 文章不存在', async () => {
    const res = await request(app).get('/blogs/000000000000000000000001')

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('BLOGS不存在')
  })
})

// ─── POST /blogs ──────────────────────────────────────────────

describe('POST /blogs - 後台新增', () => {
  it('201 - 成功建立文章', async () => {
    const res = await request(app).post('/blogs').send(validBlog)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.blogs.title).toBe(validBlog.title)
  })

  it('400 - 缺少必填欄位 title', async () => {
    const { title: _t, ...noTitle } = validBlog

    const res = await request(app).post('/blogs').send(noTitle)

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('未填寫標題')
  })

  it('400 - tags 不合法', async () => {
    const res = await request(app)
      .post('/blogs')
      .send({ ...validBlog, tags: '非法分類' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('403 - 非管理員', async () => {
    vi.mocked(admin).mockImplementationOnce((req, res) => {
      res.status(403).json({ success: false, message: '沒有權限存取此資源' })
    })

    const res = await request(app).post('/blogs').send(validBlog)

    expect(res.status).toBe(403)
  })
})

// ─── PATCH /blogs/:id ─────────────────────────────────────────

describe('PATCH /blogs/:id - 後台修改', () => {
  it('200 - 成功更新文章標題', async () => {
    const blog = await Blogs.create(validBlog)

    const res = await request(app)
      .patch(`/blogs/${blog._id}`)
      .send({ title: '更新後的標題' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.blogs.title).toBe('更新後的標題')
  })

  it('400 - 無效的 ID 格式', async () => {
    const res = await request(app).patch('/blogs/invalid-id').send({ title: '更新' })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('無效的BLOGS ID')
  })

  it('404 - 文章不存在', async () => {
    const res = await request(app)
      .patch('/blogs/000000000000000000000001')
      .send({ title: '更新' })

    expect(res.status).toBe(404)
    expect(res.body.message).toBe('BLOGS不存在')
  })

  it('403 - 非管理員', async () => {
    const blog = await Blogs.create(validBlog)
    vi.mocked(admin).mockImplementationOnce((req, res) => {
      res.status(403).json({ success: false, message: '沒有權限存取此資源' })
    })

    const res = await request(app).patch(`/blogs/${blog._id}`).send({ title: '更新' })

    expect(res.status).toBe(403)
  })
})
