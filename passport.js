import passport from 'passport'
import passportLocal from 'passport-local'
import passportJWT from 'passport-jwt'
import bcrypt from 'bcrypt'
import User from './models/user.js'

// 📌 login 策略 - 帳密驗證
passport.use(
  'login',
  new passportLocal.Strategy(
    {
      usernameField: 'username',
      passwordField: 'password',
    },
    async (username, password, done) => {
      try {
        // 檢查帳號是否存在
        const user = await User.findOne({ $or: [{ username }] }).orFail(new Error('USER NOT FOUND'))
        // 檢查密碼是否正確
        if (!password || !user.passwordHash) {
          return done(null, false, { message: '帳號或密碼錯誤' })
        }
        const isMatch = bcrypt.compareSync(password, user.passwordHash)
        if (!isMatch) {
          return done(null, false, { message: '帳號或密碼錯誤' })
        }
        // 驗證成功，把使用者資料帶到下一步
        return done(null, user)
      } catch (error) {
        console.log('passport.js login')
        console.error(error)
        // 驗證失敗，把錯誤和訊息帶到下一步
        if (error.message === 'USER NOT FOUND') {
          return done(null, false, { message: '使用者不存在' })
        } else if (error.message === 'PASSWORD') {
          return done(null, false, { message: '密碼錯誤' })
        } else {
          return done(error)
        }
      }
    },
  ),
)

// 🪪 jwt 策略 - Token 驗證
passport.use(
  'jwt',
  new passportJWT.Strategy(
    {
      jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true,
      ignoreExpiration: true,
    },
    async (req, payload, done) => {
      try {
        // 🪙 取得原始 Bearer token
        const token = passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()(req)
        // ⏰ 檢查 token 是否過期（以 payload.exp 判斷）
        const expired = payload.exp * 1000 < Date.now()
        // 🔍 判斷目前請求的 URL（避免 refresh/logout 因過期被擋）
        const url = req.baseUrl + req.path
        if (expired && url !== '/user/refresh' && url !== '/user/logout') {
          throw new Error('TOKEN EXPIRED')
        }
        // 👤 查詢使用者是否存在，且其 tokens 中包含此 token
        const user = await User.findOne({ _id: payload._id, tokens: token }).orFail(
          new Error('USER NOT FOUND'),
        )
        // ✅ 驗證成功，回傳 user 與 token 資料
        return done(null, { user, token })
      } catch (err) {
        console.log('passport.js jwt')
        console.error(err)
        if (err.message === 'USER NOT FOUND') {
          return done(null, false, { message: '使用者不存在或 token 已失效' })
        } else if (err.message === 'TOKEN EXPIRED') {
          return done(null, false, { message: 'token 已過期' })
        } else {
          return done(err)
        }
      }
    },
  ),
)
