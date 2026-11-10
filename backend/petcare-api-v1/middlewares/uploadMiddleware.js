const multer = require('multer');
const path = require('path');

const allowedTypes = new Map([
    ['image/jpeg', new Set(['.jpg', '.jpeg'])],
    ['image/png', new Set(['.png'])]
]);

const fileFilter = (_req, file, cb) => {
    const extensions = allowedTypes.get(file.mimetype);
    const extension = path.extname(file.originalname).toLowerCase();

    if (!extensions || !extensions.has(extension)) {
        const erro = new Error('Tipo de arquivo inválido. Envie uma imagem JPEG ou PNG.');
        erro.status = 400;
        return cb(erro);
    }
    return cb(null, true);
};

module.exports = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 10 }
});
