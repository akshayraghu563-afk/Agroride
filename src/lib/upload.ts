import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), 'uploads');
const vehiclesDir = path.join(uploadDir, 'vehicles');
const documentsDir = path.join(uploadDir, 'documents');
const profilesDir = path.join(uploadDir, 'profiles');

// Create directories if they don't exist
[uploadDir, vehiclesDir, documentsDir, profilesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine upload directory based on field name or route
    let uploadPath = uploadDir;

    if (req.originalUrl?.includes('/vehicles')) {
      uploadPath = vehiclesDir;
    } else if (req.originalUrl?.includes('/documents')) {
      uploadPath = documentsDir;
    } else if (req.originalUrl?.includes('/profile')) {
      uploadPath = profilesDir;
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedDocTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

  if (req.originalUrl?.includes('/profile') || file.fieldname === 'photos') {
    // Profile photos and vehicle photos - only images
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed for photos'));
    }
  } else if (req.originalUrl?.includes('/vehicles') || file.fieldname.includes('document')) {
    // Documents - images and PDFs
    if (allowedImageTypes.includes(file.mimetype) || allowedDocTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP images and PDFs are allowed for documents'));
    }
  } else {
    cb(new Error('Invalid file type'));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  }
});

// Single file upload middleware
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Multiple files upload middleware
export const uploadMultiple = (fieldName: string, maxCount: number) => upload.array(fieldName, maxCount);

// Utility function to delete a file
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(process.cwd(), filePath);
    fs.unlink(fullPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Utility function to validate file exists
export const fileExists = (filePath: string): boolean => {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
};