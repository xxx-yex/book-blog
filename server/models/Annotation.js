const mongoose = require('mongoose');

const AnnotationSchema = new mongoose.Schema({
  article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  selectedText: { type: String, required: true }, // 选中的文本
  startOffset: { type: Number, required: true }, // 在HTML内容中的起始位置
  endOffset: { type: Number, required: true }, // 在HTML内容中的结束位置
  comment: { type: String, required: true }, // 注释/说明内容
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

AnnotationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Annotation', AnnotationSchema);

