import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import * as projects from '../controllers/projects.js'

const router = Router()

// 前台
// 取得上架中的所有
router.get('/', projects.get)

// 後台
// 取得所有
router.get('/all', auth.token, auth.admin, projects.getAll)
// 新增
router.post('/', auth.token, auth.admin, projects.create)

// 前台根據id取得單一內容
router.get('/:id', projects.getId)
// 後台修改
router.patch('/:id', auth.token, auth.admin, projects.update)
// 後台刪除
router.delete('/:id', auth.token, auth.admin, projects.remove)

export default router
