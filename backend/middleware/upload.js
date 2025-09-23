import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Ensure upload directory exists
// On Google App Engine Standard, only /tmp is writable. Use that in production.
// Resolve to the same folder that server.js serves statically:
// - In GAE: /tmp/upload
// - In local/dev: <backend>/upload
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = process.env.GAE_ENV
  ? path.join('/tmp', 'upload')
  : path.join(__dirname, '..', 'upload');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // save to backend/upload
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter - allow images only
function fileFilter(req, file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Images only!"));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter,
});

export default upload;
