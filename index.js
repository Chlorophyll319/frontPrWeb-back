import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import { StatusCodes } from 'http-status-codes'
import cors from 'cors'
import userRouter from './routes/user.js'
import faqsRouter from './routes/faqs.js'
import modulesRouter from './routes/modules.js'
import projectsRouter from './routes/projects.js'
import blogsRouter from './routes/blogs.js'
import './passport.js'

// 連線資料庫 1.設環境變數 2.成功 3.失敗
mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log('☑️　資料庫連接成功 😋')
    mongoose.set('sanitizeFilter', true)
  })
  .catch((err) => {
    console.log('⛔　資料庫連線失敗 🫠')
    console.error('資料庫連線失敗', err)
  })

// 建立 express 伺服器
const app = express()
app.use(express.json())

// 使用 CORS 中介軟體（處理跨域請求）
app.use(cors())

// ↓錯誤處理
app.use((err, req, res, _next) => {
  res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    message: 'Json格式錯誤😱',
  })
})

// 設置路由（根據不同檔案有不同的東西）
app.use('/user', userRouter)
app.use('/faqs', faqsRouter)
app.use('/modules', modulesRouter)
app.use('/projects', projectsRouter)
app.use('/blogs', blogsRouter)

// 處理未定義的路由
app.all(/.*/, (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: '找不到該路由😱',
  })
})

// 監聽與啟動
app.listen(process.env.PORT || 4000, () => {
  console.log('伺服器啟動💪')
})
