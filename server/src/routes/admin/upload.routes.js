const { Router } = require('express');
const upload = require('../../middleware/upload');
const { protect, adminOnly } = require('../../middleware/auth');

const router = Router();

router.use(protect, adminOnly);

/**
 * POST /api/admin/upload
 * Upload a single image. Returns the URL.
 *
 * For now (Cloudinary not configured), we just return a placeholder.
 * When Cloudinary creds are available, this will upload to Cloudinary.
 */
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    let imageUrl;

    // Try Cloudinary if configured
    try {
      const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = require('../../config/env');

      if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
          cloud_name: CLOUDINARY_CLOUD_NAME,
          api_key: CLOUDINARY_API_KEY,
          api_secret: CLOUDINARY_API_SECRET,
        });

        // Upload from buffer using a stream
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'ashbourne',
              transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
            },
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });

        imageUrl = result.secure_url;
      }
    } catch {
      // Cloudinary not available — fall through
    }

    // Fallback: return a data URL or placeholder
    if (!imageUrl) {
      // In dev without Cloudinary, return placeholder
      imageUrl = `https://placehold.co/800x800/1a1a2e/c9a96e?text=${encodeURIComponent(req.file.originalname)}`;
    }

    res.json({
      success: true,
      data: { url: imageUrl },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
