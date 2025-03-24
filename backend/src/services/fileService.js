import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory structure if it doesn't exist
const uploadsBaseDir = path.join(__dirname, '../../uploads');
const clientUploadsDir = path.join(uploadsBaseDir, 'clients');
const tempUploadsDir = path.join(uploadsBaseDir, 'temp');

// Create directories if they don't exist
[uploadsBaseDir, clientUploadsDir, tempUploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // First store in temp directory; we'll move to client folder later
    cb(null, tempUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    
    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.+/g, '.');
    
    // Create filename with timestamp and original (sanitized) name
    const filename = uniqueSuffix + '-' + sanitizedFilename;
    
    cb(null, filename);
  }
});

// Configure file filter to restrict file types
const fileFilter = (req, file, cb) => {
  // Check if the file type is allowed
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Ungültiger Dateityp. Erlaubt sind PDF, DOC, DOCX, JPG, PNG, WEBP und HEIC.'), false);
  }
};

// Create multer upload middleware
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max size
    files: 10 // Maximum 10 files at a time
  }
});

// Move file from temp directory to client directory
const moveFileToClientDir = (clientId, filename) => {
  // Create client directory if it doesn't exist
  const clientDir = path.join(clientUploadsDir, clientId.toString());
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
  }
  
  // Source and destination file paths
  const sourcePath = path.join(tempUploadsDir, filename);
  const destPath = path.join(clientDir, filename);
  
  // Move the file
  fs.renameSync(sourcePath, destPath);
  
  // Return the new path (relative to uploads directory)
  return path.join('clients', clientId.toString(), filename);
};

// Delete a file
const deleteFile = (filePath) => {
  const fullPath = path.join(uploadsBaseDir, filePath);
  
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  } else {
    console.warn(`File not found: ${fullPath}`);
    return false;
  }
};

// Get file path for a client document
const getClientFilePath = (clientId, filename) => {
  return path.join(clientUploadsDir, clientId.toString(), filename);
};

// Export the service
export default {
  upload,
  moveFileToClientDir,
  deleteFile,
  getClientFilePath,
  uploadsBaseDir
};