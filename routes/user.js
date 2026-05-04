import { Router } from 'express'
import * as user from '../controllers/user.js'
import * as auth from '../middlewares/auth.js'

const router = Router()

// 建立使用者帳號（僅限管理員）
router.post('/', auth.token, auth.admin, user.create)
// 登入
router.post('/login', auth.login, user.login)

// token 舊換新
router.patch('/refresh', auth.token, user.refresh)
// 使用者登出
router.delete('/logout', auth.token, user.logout)

export default router
