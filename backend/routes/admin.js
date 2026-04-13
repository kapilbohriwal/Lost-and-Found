const express = require('express');
const User    = require('../models/User');
const Item    = require('../models/Item');
const Message = require('../models/Message');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [users, lost, found, resolved, messages] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments({ type: 'lost' }),
      Item.countDocuments({ type: 'found' }),
      Item.countDocuments({ status: 'resolved' }),
      Message.countDocuments(),
    ]);
    res.json({ success: true, stats: { users, lost, found, resolved, messages, total: lost + found } });
  } catch (err) { next(err); }
});

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json({ success: true, users });
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
    await User.findByIdAndDelete(req.params.id);
    await Item.deleteMany({ postedBy: req.params.id });
    res.json({ success: true, message: 'User and their posts deleted' });
  } catch (err) { next(err); }
});

// GET /api/admin/items  – all items
router.get('/items', async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type   && type   !== 'all') filter.type   = type;
    if (status && status !== 'all') filter.status = status;
    const total = await Item.countDocuments(filter);
    const items = await Item.find(filter)
      .populate('postedBy', 'name avatar email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, total, items });
  } catch (err) { next(err); }
});

module.exports = router;
