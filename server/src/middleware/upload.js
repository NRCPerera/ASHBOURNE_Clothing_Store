const multer = require('multer');
const path = require('path');

/**
 * Multer configuration for image uploads.
 * In Phase 2 we use memory storage — images are passed to Cloudinary
 * (or saved locally as a fallback if Cloudinary isn't configured).
 */

// File filter — images only
const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed'), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

module.exports = upload;
