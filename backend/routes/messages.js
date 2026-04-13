const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Item    = require('../models/Item');
const { protect } = require('../middleware/auth');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });
  next();
};

// POST /api/messages  – send message
router.post('/', protect, [
  body('itemId').notEmpty().withMessage('Item ID required'),
  body('message').trim().notEmpty().withMessage('Message cannot be empty')
    .isLength({ max: 1000 }).withMessage('Message too long'),
], validate, async (req, res, next) => {
  try {
    const { itemId, message } = req.body;
    const item = await Item.findById(itemId).populate('postedBy', '_id name');
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    if (item.postedBy._id.toString() === req.user._id.toString())
      return res.status(400).json({ success: false, error: 'You cannot message yourself' });

    const msg = await Message.create({
      item:     itemId,
      sender:   req.user._id,
      receiver: item.postedBy._id,
      message,
    });
    await msg.populate([
      { path: 'sender',   select: 'name avatar' },
      { path: 'receiver', select: 'name avatar' },
      { path: 'item',     select: 'title type'  },
    ]);
    res.status(201).json({ success: true, message: msg });
  } catch (err) { next(err); }
});

// GET /api/messages/inbox
router.get('/inbox', protect, async (req, res, next) => {
  try {
    const messages = await Message.find({ receiver: req.user._id })
      .populate('sender',   'name avatar')
      .populate('item',     'title type')
      .sort('-createdAt');
    res.json({ success: true, messages, unread: messages.filter(m => !m.read).length });
  } catch (err) { next(err); }
});

// PATCH /api/messages/:id/read
router.patch('/:id/read', protect, async (req, res, next) => {
  try {
    await Message.findOneAndUpdate({ _id: req.params.id, receiver: req.user._id }, { read: true });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
