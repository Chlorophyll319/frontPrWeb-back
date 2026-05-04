import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'

vi.mock('../models/user.js', () => ({
  default: vi.fn(),
}))

vi.mock('../middlewares/auth.js', () => ({
  token: vi.fn((req, res, next) => next()),
  admin: vi.fn((req, res, next) => next()),
  login: vi.fn((req, res, next) => next()),
}))

const { default: User } = await import('../models/user.js')
const { token, admin } = await import('../middlewares/auth.js')
const { default: router } = await import('../routes/user.js')

const createApp = () => {
  const app = express()
  app.use(express.json())
  app.use('/user', router)
  return app
}

describe('POST /user - 建立使用者（管理員）', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(token).mockImplementation((req, res, next) => next())
    vi.mocked(admin).mockImplementation((req, res, next) => next())
  })

  it('201 - 成功建立帳號（預設 role: user）', async () => {
    vi.mocked(User).mockImplementation(function () {
      return {
        _id: 'abc123',
        username: 'testuser',
        role: 'user',
        save: vi.fn().mockResolvedValue(undefined),
      }
    })

    const res = await request(createApp())
      .post('/user')
      .send({ username: 'testuser', password: 'pass1234' })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.result.username).toBe('testuser')
    expect(res.body.result.role).toBe('user')
    expect(res.body.result.passwordHash).toBeUndefined()
    expect(res.body.result.tokens).toBeUndefined()
  })

  it('201 - 成功建立管理員帳號（role: admin）', async () => {
    vi.mocked(User).mockImplementation(function () {
      return {
        _id: 'abc456',
        username: 'adminuser',
        role: 'admin',
        save: vi.fn().mockResolvedValue(undefined),
      }
    })

    const res = await request(createApp())
      .post('/user')
      .send({ username: 'adminuser', password: 'pass1234', role: 'admin' })

    expect(res.status).toBe(201)
    expect(res.body.result.role).toBe('admin')
  })

  it('400 - 驗證失敗（缺少必填欄位）', async () => {
    vi.mocked(User).mockImplementation(function () {
      return {
        save: vi.fn().mockRejectedValue({
          name: 'ValidationError',
          errors: { username: { message: '未填寫帳號' } },
        }),
      }
    })

    const res = await request(createApp()).post('/user').send({ password: 'pass1234' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('未填寫帳號')
  })

  it('409 - 帳號已存在', async () => {
    vi.mocked(User).mockImplementation(function () {
      return {
        save: vi.fn().mockRejectedValue({ name: 'MongoServerError', code: 11000 }),
      }
    })

    const res = await request(createApp())
      .post('/user')
      .send({ username: 'existing', password: 'pass1234' })

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('帳號已存在')
  })

  it('403 - 非管理員無法建立帳號', async () => {
    vi.mocked(admin).mockImplementationOnce((req, res) => {
      res.status(403).json({ success: false, message: '沒有權限存取此資源' })
    })

    const res = await request(createApp())
      .post('/user')
      .send({ username: 'hacker', password: 'pass1234' })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('沒有權限存取此資源')
  })

  it('500 - 其他未知錯誤', async () => {
    vi.mocked(User).mockImplementation(function () {
      return { save: vi.fn().mockRejectedValue(new Error('DB crashed')) }
    })

    const res = await request(createApp())
      .post('/user')
      .send({ username: 'testuser', password: 'pass1234' })

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })
})
