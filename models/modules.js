import { model, Schema } from 'mongoose'

const schema = new Schema(
  {
    title: {
      type: String,
      required: [true, '請填寫標題'],
      maxlength: [100, '標題不能超過 100 個字元'],
    },
    imageUrl: {
      type: String,
      required: [true, '請提供圖片'],
    },
    description: {
      type: String,
      required: [true, '請填寫說明文字'],
      maxlength: [300, '說明文字不能超過 300 個字元'],
    },
    category: {
      type: String,
      required: [true, '請選擇分類'],
      enum: {
        values: [
          '前端基礎技術',
          '前端框架與進階技術',
          '後端開發與 API 串接',
          '資料庫設計與操作',
          '版本控制與專案維運',
          'UI/UX 設計',
          '作品製作與分享',
        ],
        message: '請選擇有效分類',
      },
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    visible: {
      type: Boolean,
      default: true,
      required: [true, '請設定可見度'],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)

export default model('modules', schema)
