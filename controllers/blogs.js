import Blogs from '../models/blogs.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'

export const create = async (req, res) => {
  try {
    const blogs = await Blogs.create({
      title: req.body.title,
      summary: req.body.summary,
      content: req.body.content,
      coverImage: req.body.coverImage,
      tags: req.body.tags,
      author: req.body.author,
      visible: req.body.visible,
    })
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: '建立成功🌹',
      blogs,
    })
  } catch (err) {
    console.log('controllers/blogs.js create')
    console.error(err)
    if (err.name === 'ValidationError') {
      const key = Object.keys(err.errors)[0]
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: err.errors[key].message,
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器內部錯誤',
      })
    }
  }
}

export const getAll = async (req, res) => {
  try {
    const blogs = await Blogs.find()
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'blogs列表取得成功',
      blogs,
    })
  } catch (error) {
    console.log('controllers/blogs.js getAll')
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器內部錯誤',
    })
  }
}

export const get = async (req, res) => {
  try {
    const tag = req.query.tag || ''
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10))

    const filter = { visible: true, ...(tag ? { tags: tag } : {}) }
    const total = await Blogs.countDocuments(filter)
    const totalPages = Math.ceil(total / limit)
    const blogs = await Blogs.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'blogs列表取得成功',
      blogs,
      total,
      page,
      totalPages,
    })
  } catch (error) {
    console.log('controllers/blogs.js get')
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器內部錯誤',
    })
  }
}

export const update = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) {
      throw new Error('BLOGS ID')
    }

    // Mongoose 方法：依 ID 更新並回傳
    const blogs = await Blogs.findByIdAndUpdate(
      req.params.id,
      {
        // 代表表單中送來的資料欄位（例如 name、price）
        ...req.body,
      },
      {
        // 	回傳「更新後」的新資料
        // 強制啟用 Mongoose 的欄位驗證
        new: true,
        runValidators: true,
      },

      // 若查不到對應 ID，則丟錯（走 catch）
    ).orFail(new Error('BLOGS NOT FOUND'))

    // ✅ 成功時，回傳更新後的BLOGS資料
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'BLOGS更新成功',
      blogs,
    })
  } catch (error) {
    console.log('controllers/blogs.js update')
    console.error(error)
    if (error.message === 'BLOGS ID') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '無效的BLOGS ID',
      })
    } else if (error.message === 'BLOGS NOT FOUND') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'BLOGS不存在',
      })
    } else if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.errors[key].message,
      })
    } else {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器內部錯誤',
      })
    }
  }
}

export const getId = async (req, res) => {
  try {
    // 檢查BLOGS ID 是否有效
    if (!validator.isMongoId(req.params.id)) {
      throw new Error('BLOGS ID')
    }

    const blogs = await Blogs.findById(req.params.id).orFail(new Error('BLOGS NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'BLOGS取得成功',
      blogs,
    })
  } catch (error) {
    console.log('controllers/blogs.js getId')
    console.error(error)
    if (error.message === 'BLOGS ID') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '無效的BLOGS ID',
      })
    } else if (error.message === 'BLOGS NOT FOUND') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'BLOGS不存在',
      })
    } else {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器內部錯誤',
      })
    }
  }
}
