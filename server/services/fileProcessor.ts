import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { extractTextFromDocument } from '../openai';

// Configure multer for file uploads
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  },
});

export interface ProcessedFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  content: string;
  metadata: Record<string, any>;
}

export async function processUploadedFile(file: Express.Multer.File): Promise<ProcessedFile> {
  let content = '';
  let metadata: Record<string, any> = {};

  try {
    switch (file.mimetype) {
      case 'text/plain':
      case 'text/csv':
        content = file.buffer.toString('utf8');
        break;
        
      case 'application/pdf':
        // For PDF files, we'll use a simple text extraction approach
        // In production, you might want to use pdf-parse or similar
        content = await extractTextFromPDF(file.buffer);
        break;
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        // For DOCX files, basic text extraction
        content = await extractTextFromDOCX(file.buffer);
        break;
        
      default:
        throw new Error(`Unsupported file type: ${file.mimetype}`);
    }

    // Use OpenAI to clean and enhance the extracted text
    content = await extractTextFromDocument(content, file.mimetype);

    metadata = {
      originalSize: file.size,
      processedAt: new Date().toISOString(),
      contentLength: content.length,
      fileType: file.mimetype,
    };

    return {
      filename: `${Date.now()}-${file.originalname}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      content,
      metadata,
    };
  } catch (error) {
    throw new Error(`Failed to process file: ${error.message}`);
  }
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Simple PDF text extraction - in production use pdf-parse
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    // Fallback: convert buffer to string and extract readable text
    const text = buffer.toString('utf8');
    // Basic cleanup for PDF-like content
    return text
      .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-printable chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  // Simple DOCX text extraction - in production use mammoth or docx-parser
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    // Fallback: basic text extraction from XML-like structure
    const text = buffer.toString('utf8');
    // Extract text from XML-like content
    return text
      .replace(/<[^>]*>/g, '') // Remove XML tags
      .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-printable chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}

export function validateFileUpload(file: Express.Multer.File): string | null {
  if (!file) {
    return 'No file provided';
  }

  if (file.size > 10 * 1024 * 1024) {
    return 'File size exceeds 10MB limit';
  }

  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
  ];

  if (!allowedMimes.includes(file.mimetype)) {
    return 'Unsupported file type. Please upload PDF, DOCX, TXT, or CSV files.';
  }

  return null;
}
