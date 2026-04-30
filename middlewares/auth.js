import passport from 'passport'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'

export const login = (req, res, next) => {
  passport.authenticate('login', { session: false }, (error, user, info) => {
    if (!user || error) {
      if (info?.message === 'Missing credentials') {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '請提供帳號密碼',
        })
      } else if (!error && info) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: info.message,
        })
      } else {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '伺服器內部錯誤',
        })
      }
    }
    req.user = user
    next()
  })(req, res, next)
}

export const token = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (error, data, info) => {
    if (!data || error) {
      // 是不是 JWT 錯誤，可能是過期、格式錯誤、SECRET 錯誤等
      if (info instanceof jwt.JsonWebTokenError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '無效的 token',
        })
      }

      // 其他 info，可能是查無使用者
      else if (info) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: info.message || '無效的 token',
        })
      }
      // 沒有 info，但是有錯誤
      else {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '伺服器內部錯誤',
        })
      }
    }
    req.user = data.user
    req.token = data.token
    next()
  })(req, res, next)
}

export const admin = (req, res, next) => {
  // 檢查使用者是否為管理員
  if (req.user.role !== 'admin') {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: '沒有權限存取此資源',
    })
  }
  next()
}
