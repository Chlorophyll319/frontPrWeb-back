import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import * as blogs from '../controllers/blogs.js'

const router = Router()

// 前台
// 取得上架中的所有
router.get('/', blogs.get)

// 後台
// 取得所有
router.get('/all', auth.token, auth.admin, blogs.getAll)
// 新增
router.post('/', auth.token, auth.admin, blogs.create)

// 前台根據id取得單一內容
router.get('/:id', blogs.getId)
// 後台修改
router.patch('/:id', auth.token, auth.admin, blogs.update)

export default router
