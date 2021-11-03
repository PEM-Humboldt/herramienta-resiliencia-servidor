const multer  = require('multer')

const storage = multer.diskStorage({
  destination: `${process.cwd()}/uploads/`,
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const filter = (req, file, cb) => {
  if (file.mimetype !== 'application/zip') {
    const err = new Error('Only .zip files are supported');
    err.desc = `File sent: ${file.originalname}`;
    cb(err);
  } else {
    cb(null, true);
  }
};

module.exports = multer({ storage,  fileFilter: filter});
