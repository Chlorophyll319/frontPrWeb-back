import Faqs from '../models/faqs.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'

export const create = async (req, res) => {
  try {
    const faqs = await Faqs.create({
      question: req.body.question,
      answer: req.body.answer,
      category: req.body.category,
      sortOrder: req.body.sortOrder,
      visible: req.body.visible,
    })
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: '建立成功🌹',
      faqs,
    })
  } catch (err) {
    console.log('controllers/faqs.js create')
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
    const faqs = await Faqs.find()
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'faq列表取得成功',
      faqs,
    })
  } catch (error) {
    console.log('controllers/faqs.js getAll')
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器內部錯誤',
    })
  }
}

export const get = async (req, res) => {
  try {
    const faqs = await Faqs.find({ visible: true }).sort({ sortOrder: 1 })
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'faq列表取得成功',
      faqs,
    })
  } catch (error) {
    console.log('controllers/faqs.js getAll')
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
      throw new Error('FAQS ID')
    }

    // Mongoose 方法：依 ID 更新並回傳
    const faqs = await Faqs.findByIdAndUpdate(
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
    ).orFail(new Error('FAQS NOT FOUND'))

    // ✅ 成功時，回傳更新後的faqs資料
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Faqs更新成功',
      faqs,
    })
  } catch (error) {
    console.log('controllers/faqs.js update')
    console.error(error)
    if (error.message === 'FAQS ID') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '無效的Faqs ID',
      })
    } else if (error.message === 'FAQS NOT FOUND') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Faqs不存在',
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
    // 檢查faqs ID 是否有效
    if (!validator.isMongoId(req.params.id)) {
      throw new Error('FAQS ID')
    }

    const faqs = await Faqs.findById(req.params.id).orFail(new Error('FAQS NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'faqs取得成功',
      faqs,
    })
  } catch (error) {
    console.log('controllers/faqs.js getId')
    console.error(error)
    if (error.message === 'FAQS ID') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '無效的faqs ID',
      })
    } else if (error.message === 'FAQS NOT FOUND') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'faqs不存在',
      })
    } else {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器內部錯誤',
      })
    }
  }
}
