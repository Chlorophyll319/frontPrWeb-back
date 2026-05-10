import { Schema, model } from 'mongoose'
import bcrypt from 'bcrypt'

const schema = new Schema(
  {
    username: {
      type: String,
      required: [true, '未填寫帳號'],
      unique: true,
      trim: true,
      minlength: 4,
      maxlength: 8,
    },
    passwordHash: {
      type: String,
      required: [true, '未填寫密碼'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    tokens: {
      type: [String],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)
// 虛擬欄位
// 設定 plain password，自動轉成 passwordHash
schema
  .virtual('password')
  .set(function (val) {
    this._password = val
    this.passwordHash = bcrypt.hashSync(val, 10)
  })
  .get(function () {
    return this._password
  })

schema.pre('save', function (next) {
  const user = this
  // 限制有效 token 數量
  if (user.isModified('tokens') && user.tokens.length > 3) {
    user.tokens.shift()
  }
  next()
})

export default model('users', schema)
