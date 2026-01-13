import multer from 'multer';

export const createUploadMiddleware = (uploadDir: string, tmpDir: string) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      console.log(`[Multer] Destination requested for file: ${file.originalname}`);
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      console.log(`[Multer] Filename requested for file: ${file.originalname}`);
      cb(null, file.originalname);
    },
  });

  const upload = multer({ storage: storage });

  const trimUpload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, tmpDir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
      },
    }),
  });

  return { upload, trimUpload };
};
