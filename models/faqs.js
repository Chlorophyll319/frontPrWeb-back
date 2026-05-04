import { Schema, model } from 'mongoose'

const schema = new Schema(
  {
    question: {
      type: String,
      required: [true, '未填寫問題'],
      trim: true,
      maxlength: [200, '問題不能超過 200 字'],
      validate: {
        validator: (v) => v.trim().length > 0,
        message: '問題不能是空白',
      },
    },
    answer: {
      type: String,
      required: [true, '未填寫答案'],
      trim: true,
      maxlength: [1000, '答案不能超過 1000 字'],
    },
    category: {
      type: String,
      required: [true, '請選擇分類'],
      enum: {
        values: ['課程內容', '報名', '甄試', '!!重要'],
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

export default model('faqs', schema)
