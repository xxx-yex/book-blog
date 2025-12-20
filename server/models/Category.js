const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: String,
  sortOrder: { type: Number, default: 0 }
});

module.exports = mongoose.model('Category', CategorySchema);

