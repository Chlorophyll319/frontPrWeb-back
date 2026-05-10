import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import app from './helpers/app.js'
import { connect, clearDatabase, closeDatabase } from './helpers/db.js'
import User from '../models/user.js'

vi.mock('../middlewares/auth.js', () => ({
  token: vi.fn((req, res, next) => next()),
  admin: vi.fn((req, res, next) => next()),
  login: vi.fn((req, res, next) => next()),
}))

const { token, admin, login } = await import('../middlewares/auth.js')

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
  vi.mocked(login).mockImplementation((req, res, next) => next())
  await clearDatabase()
})

// ─── POST /user ───────────────────────────────────────────────

describe('POST /user - 建立使用者（管理員）', () => {
  it('201 - 成功建立帳號（預設 role: user）', async () => {
    const res = await request(app)
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
    const res = await request(app)
      .post('/user')
      .send({ username: 'admin1', password: 'pass1234', role: 'admin' })

    expect(res.status).toBe(201)
    expect(res.body.result.role).toBe('admin')
  })

  it('400 - 帳號過短（minlength: 4）', async () => {
    const res = await request(app).post('/user').send({ username: 'ab', password: 'pass1234' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('409 - 帳號已存在', async () => {
    await new User({ username: 'dupuser', password: 'pass1234' }).save()

    const res = await request(app)
      .post('/user')
      .send({ username: 'dupuser', password: 'pass1234' })

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('帳號已存在')
  })

  it('403 - 非管理員無法建立帳號', async () => {
    vi.mocked(admin).mockImplementationOnce((req, res) => {
      res.status(403).json({ success: false, message: '沒有權限存取此資源' })
    })

    const res = await request(app)
      .post('/user')
      .send({ username: 'hacker', password: 'pass1234' })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('沒有權限存取此資源')
  })
})

// ─── POST /user/login ─────────────────────────────────────────

describe('POST /user/login - 登入', () => {
  beforeEach(async () => {
    await new User({ username: 'lguser', password: 'pass1234' }).save()
  })

  it('200 - 登入成功，回傳 token', async () => {
    vi.mocked(login).mockImplementationOnce(async (req, res, next) => {
      req.user = await User.findOne({ username: 'lguser' })
      next()
    })

    const res = await request(app).post('/user/login').send()

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('登入成功')
    expect(typeof res.body.user.token).toBe('string')
    expect(res.body.user.username).toBe('lguser')

    const dbUser = await User.findOne({ username: 'lguser' })
    expect(dbUser.tokens).toHaveLength(1)
  })

  it('401 - 認證失敗（auth.login 拒絕）', async () => {
    vi.mocked(login).mockImplementationOnce((req, res) => {
      res.status(400).json({ success: false, message: '帳號或密碼錯誤' })
    })

    const res = await request(app).post('/user/login').send()

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('500 - 儲存 token 失敗', async () => {
    vi.mocked(login).mockImplementationOnce(async (req, res, next) => {
      const user = await User.findOne({ username: 'lguser' })
      user.save = vi.fn().mockRejectedValue(new Error('DB error'))
      req.user = user
      next()
    })

    const res = await request(app).post('/user/login').send()

    expect(res.status).toBe(500)
    expect(res.body.success).toBe(false)
  })
})

// ─── PATCH /user/refresh ──────────────────────────────────────

describe('PATCH /user/refresh - token 換新', () => {
  it('200 - 成功換新 token', async () => {
    const user = new User({ username: 'rfuser', password: 'pass1234' })
    user.tokens.push('old-token-abc')
    await user.save()

    vi.mocked(token).mockImplementationOnce(async (req, res, next) => {
      req.user = await User.findOne({ username: 'rfuser' })
      req.token = 'old-token-abc'
      next()
    })

    const res = await request(app).patch('/user/refresh').send()

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(typeof res.body.token).toBe('string')

    const dbUser = await User.findOne({ username: 'rfuser' })
    expect(dbUser.tokens).not.toContain('old-token-abc')
    expect(dbUser.tokens).toHaveLength(1)
  })

  it('400 - token 驗證失敗（auth.token 拒絕）', async () => {
    vi.mocked(token).mockImplementationOnce((req, res) => {
      res.status(400).json({ success: false, message: '無效的 token' })
    })

    const res = await request(app).patch('/user/refresh').send()

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

// ─── DELETE /user/logout ──────────────────────────────────────

describe('DELETE /user/logout - 登出', () => {
  it('200 - 成功登出，token 從陣列移除', async () => {
    const user = new User({ username: 'lousr', password: 'pass1234' })
    user.tokens.push('session-token-xyz')
    await user.save()

    vi.mocked(token).mockImplementationOnce(async (req, res, next) => {
      req.user = await User.findOne({ username: 'lousr' })
      req.token = 'session-token-xyz'
      next()
    })

    const res = await request(app).delete('/user/logout').send()

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    const dbUser = await User.findOne({ username: 'lousr' })
    expect(dbUser.tokens).not.toContain('session-token-xyz')
    expect(dbUser.tokens).toHaveLength(0)
  })

  it('400 - 未帶 token（auth.token 拒絕）', async () => {
    vi.mocked(token).mockImplementationOnce((req, res) => {
      res.status(400).json({ success: false, message: '無效的 token' })
    })

    const res = await request(app).delete('/user/logout').send()

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})
