import { Schema, model } from 'mongoose'

const schema = new Schema(
  {
    title: {
      type: String,
      required: [true, '未填寫標題'],
      trim: true,
      maxlength: [200, '標題不能超過 200 字'],
      validate: {
        validator: (v) => v.trim().length > 0,
        message: '標題不能是空白',
      },
    },
    summary: {
      type: String,
      required: [true, '未填寫簡介'],
      trim: true,
      maxlength: [300, '簡介不能超過 300 字'],
    },
    content: {
      type: String,
      required: [true, '未填寫內容'],
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    tags: {
      type: String,
      required: [true, '請選擇分類'],
      enum: {
        values: [
          '職訓局環境',
          '甄試相關',
          '課程相關',
          '訓練期間相關規則',
          '職訓相關補助',
          '學員心得',
        ],
        message: '請選擇有效分類',
      },
    },
    author: {
      type: String,
      trim: true,
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

export default model('blogs', schema)
