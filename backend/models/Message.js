const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  item:       { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  sender:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message:    { type: String, required: [true, 'Message cannot be empty'], maxlength: [1000, 'Message too long'] },
  read:       { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
