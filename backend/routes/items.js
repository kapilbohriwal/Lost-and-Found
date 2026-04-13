const express  = require('express');
const { body, param, query, validationResult } = require('express-validator');
const fs       = require('fs');
const path     = require('path');
const Item     = require('../models/Item');
const { protect, optionalAuth } = require('../middleware/auth');
const upload   = require('../middleware/upload');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array()[0].msg });
  next();
};

const CATEGORIES = ['Electronics','Clothing','Accessories','Documents','Keys','Bags','Sports','Books','Jewellery','Other'];

const itemRules = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3–100 characters'),
  body('category').isIn(CATEGORIES).withMessage('Invalid category'),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be 10–1000 characters'),
  body('location').trim().notEmpty().withMessage('Location is required')
    .isLength({ max: 200 }).withMessage('Location too long'),
  body('date').isISO8601().withMessage('Enter a valid date'),
];

// GET /api/items  – list with filters, search, pagination
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { search, type, category, status, page = 1, limit = 12, sort = '-createdAt' } = req.query;

    const filter = {};
    if (type     && type     !== 'all') filter.type     = type;
    if (category && category !== 'all') filter.category = category;
    if (status   && status   !== 'all') filter.status   = status;
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location:    { $regex: search, $options: 'i' } },
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Item.countDocuments(filter);
    const items = await Item.find(filter)
      .populate('postedBy', 'name avatar email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / limit), items });
  } catch (err) { next(err); }
});

// GET /api/items/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [lost, found, resolvedLost, resolvedFound] = await Promise.all([
      Item.countDocuments({ type: 'lost' }),
      Item.countDocuments({ type: 'found' }),
      Item.countDocuments({ type: 'lost',  status: 'resolved' }),
      Item.countDocuments({ type: 'found', status: 'resolved' }),
    ]);
    res.json({ success: true, stats: { lost, found, resolved: resolvedLost + resolvedFound, total: lost + found } });
  } catch (err) { next(err); }
});

// GET /api/items/my  – current user's posts
router.get('/my', protect, async (req, res, next) => {
  try {
    const items = await Item.find({ postedBy: req.user._id }).sort('-createdAt');
    res.json({ success: true, items });
  } catch (err) { next(err); }
});

// GET /api/items/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id, { $inc: { views: 1 } }, { new: true }
    ).populate('postedBy', 'name avatar email phone');
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, item });
  } catch (err) { next(err); }
});

// POST /api/items  – create
router.post('/', protect, upload.single('image'), itemRules, [
  body('type').isIn(['lost', 'found']).withMessage('Type must be lost or found'),
], validate, async (req, res, next) => {
  try {
    const { type, title, category, description, location, date } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const item = await Item.create({
      type, title, category, description, location,
      date: new Date(date),
      imageUrl,
      postedBy:     req.user._id,
      contactName:  req.user.name,
      contactEmail: req.user.email,
    });
    await item.populate('postedBy', 'name avatar email');
    res.status(201).json({ success: true, item });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
});

// PUT /api/items/:id  – update (owner or admin)
router.put('/:id', protect, upload.single('image'), [
  body('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3–100 chars'),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10–1000 chars'),
], validate, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    if (item.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, error: 'Not authorised' });

    const updates = { ...req.body };
    if (req.file) {
      if (item.imageUrl) {
        const old = path.join(__dirname, '../../', item.imageUrl);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      updates.imageUrl = `/uploads/${req.file.filename}`;
    }
    const updated = await Item.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('postedBy', 'name avatar email');
    res.json({ success: true, item: updated });
  } catch (err) { next(err); }
});

// PATCH /api/items/:id/resolve
router.patch('/:id/resolve', protect, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    if (item.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, error: 'Not authorised' });
    item.status = 'resolved';
    await item.save();
    res.json({ success: true, message: 'Marked as resolved' });
  } catch (err) { next(err); }
});

// DELETE /api/items/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    if (item.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, error: 'Not authorised' });
    if (item.imageUrl) {
      const imgPath = path.join(__dirname, '../../', item.imageUrl);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await item.deleteOne();
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
