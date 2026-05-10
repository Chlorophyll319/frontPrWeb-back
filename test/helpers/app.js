import express from 'express'
import { StatusCodes } from 'http-status-codes'
import userRouter from '../../routes/user.js'
import faqsRouter from '../../routes/faqs.js'
import modulesRouter from '../../routes/modules.js'
import projectsRouter from '../../routes/projects.js'
import blogsRouter from '../../routes/blogs.js'

const app = express()

app.use(express.json())
app.use('/user', userRouter)
app.use('/faqs', faqsRouter)
app.use('/modules', modulesRouter)
app.use('/projects', projectsRouter)
app.use('/blogs', blogsRouter)

app.all(/.*/, (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({ success: false, message: '找不到該路由' })
})

app.use((err, req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'Json格式錯誤' })
  }
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: '伺服器內部錯誤' })
})

export default app
