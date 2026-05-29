const { upload, handleUploadError } = require('../middleware/upload');

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

router.post('/:type', authMiddleware, upload.single('file'), handleUploadError, (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: '请选择文件'
        });
    }

    const fileUrl = `/uploads/${req.params.type}/${req.file.filename}`;

    res.json({
        success: true,
        message: '文件上传成功',
        data: {
            url: fileUrl,
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size
        }
    });
});

module.exports = router;
