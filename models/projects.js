import { Schema, model } from 'mongoose'

const schema = new Schema(
  {
    studentName: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, '標題不能超過 100 個字元'],
    },
    demoUrl: {
      type: String,
      trim: true,
      required: [true, '請提供精選作品的網址'],
    },
    imageUrl: {
      type: String,
      trim: true,
      required: [true, '請設置專案封面圖片網址'],
    },
    description: {
      type: String,
      maxlength: [1000, '描述請勿超過 1000 字'],
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    visible: {
      type: Boolean,
      default: true,
      required: [true, '請設置可見度'],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)

export default model('projects', schema)
