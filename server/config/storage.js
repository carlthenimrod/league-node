const concat = require('concat-stream');
const fs = require('fs');
const mkdirp = require('mkdirp');
const crypto = require('crypto');
const Jimp = require('jimp');

const ProfileStorage = () => {
  let path,
      fileName;

  const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg'
  };

  const getPath = (id) => {
    path = `server/public/users/${id}/`;
    mkdirp.sync(path);
  };

  const getFileName = (file) => {
    const ext = MIME_TYPE_MAP[file.mimetype];

    if (!ext) { 
      const err = new Error('Invalid MIME type');
      err.status = 400;
      throw err; 
    }

    fileName = crypto.randomBytes(6).toString('hex') + '-' + Date.now() + '.' + ext;
  }

  const processImage = (img, data) => {
    const {x, y, width, height} = data;

    return img.resize(+width, +height)
      .crop(+x, +y, 150, 150)
      .writeAsync(`${path}${fileName}`);
  };

  const _handleFile = (req, file, cb) => {
    file.stream.pipe(concat(async (imgBuffer) => {
      try {
        getPath(req.params.id);
        getFileName(file);

        const img = await Jimp.read(imgBuffer);

        await processImage(img, req.body);
        cb(null, { path, fileName });
      } catch(e) {
        cb(e);
      }
    }));
  };

  const _removeFile = (req, file, cb) => {
    fs.unlink(`${file.path}${file.fileName}`, cb)
  };

  return {
    _handleFile,
    _removeFile
  }
};

module.exports = ProfileStorage;