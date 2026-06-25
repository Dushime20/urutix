import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getEnvConfig } from '../../config/env.config';

export interface FileUploadResult {
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  checksum: string;
}

export interface FileInfo {
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  checksum: string;
  createdAt: Date;
}

@Injectable()
export class FileUploadService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.maxFileSize = this.configService.get<number>(
      'MAX_FILE_SIZE',
      10 * 1024 * 1024,
    ); // 10MB
    this.allowedMimeTypes = [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      // Other
      'application/json',
      'application/xml',
    ];

    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    subdirectory?: string,
  ): Promise<FileUploadResult> {
    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;

    // Create subdirectory path
    const uploadPath = subdirectory
      ? path.join(this.uploadDir, subdirectory)
      : this.uploadDir;

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filePath = path.join(uploadPath, fileName);

    try {
      // Handle both memory and disk storage
      let fileBuffer: Buffer;
      if (file.buffer) {
        // File is in memory
        fileBuffer = file.buffer;
        fs.writeFileSync(filePath, fileBuffer);
      } else if (file.path) {
        // File is on disk (from Multer disk storage)
        fileBuffer = fs.readFileSync(file.path);
        // Move file from temp location to final location
        fs.copyFileSync(file.path, filePath);
        // Clean up temp file
        fs.unlinkSync(file.path);
      } else {
        throw new BadRequestException('File buffer or path is missing');
      }

      // Calculate checksum
      const checksum = this.calculateChecksum(fileBuffer);

      // Generate URLs
      const { backendUrl: baseUrl } = getEnvConfig();
      const fileUrl = `${baseUrl}/uploads/${subdirectory ? subdirectory + '/' : ''}${fileName}`;

      let thumbnailUrl: string | undefined;
      if (this.isImage(file.mimetype)) {
        thumbnailUrl = await this.generateThumbnail(
          filePath,
          fileName,
          subdirectory,
        );
      }

      return {
        fileName,
        originalFileName: file.originalname,
        fileUrl,
        thumbnailUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileExtension,
        checksum,
      };
    } catch (error) {
      // Clean up file if it was created
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // MIME type validation removed to allow any document type
    // if (!this.allowedMimeTypes.includes(file.mimetype)) {
    //   throw new BadRequestException(
    //     `File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`
    //   );
    // }
  }

  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private async generateThumbnail(
    filePath: string,
    fileName: string,
    subdirectory?: string,
  ): Promise<string> {
    // For now, we'll return the original file URL
    // In a production environment, you'd want to use a library like sharp or jimp
    // to generate actual thumbnails
    const { backendUrl: baseUrl } = getEnvConfig();
    return `${baseUrl}/uploads/${subdirectory ? subdirectory + '/' : ''}${fileName}`;
  }

  async getFileInfo(
    fileName: string,
    subdirectory?: string,
  ): Promise<FileInfo> {
    const filePath = subdirectory
      ? path.join(this.uploadDir, subdirectory, fileName)
      : path.join(this.uploadDir, fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File ${fileName} not found`);
    }

    const stats = fs.statSync(filePath);
    const { backendUrl: baseUrl } = getEnvConfig();
    const fileUrl = `${baseUrl}/uploads/${subdirectory ? subdirectory + '/' : ''}${fileName}`;

    return {
      fileName,
      originalFileName: fileName, // We don't store original name separately
      fileUrl,
      fileSize: stats.size,
      mimeType: this.getMimeType(fileName),
      fileExtension: path.extname(fileName),
      checksum: '', // Would need to recalculate
      createdAt: stats.birthtime,
    };
  }

  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed',
      '.json': 'application/json',
      '.xml': 'application/xml',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  async deleteFile(fileName: string, subdirectory?: string): Promise<void> {
    const filePath = subdirectory
      ? path.join(this.uploadDir, subdirectory, fileName)
      : path.join(this.uploadDir, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async fileExists(fileName: string, subdirectory?: string): Promise<boolean> {
    const filePath = subdirectory
      ? path.join(this.uploadDir, subdirectory, fileName)
      : path.join(this.uploadDir, fileName);

    return fs.existsSync(filePath);
  }

  getFileStream(fileName: string, subdirectory?: string): fs.ReadStream {
    const filePath = subdirectory
      ? path.join(this.uploadDir, subdirectory, fileName)
      : path.join(this.uploadDir, fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File ${fileName} not found`);
    }

    return fs.createReadStream(filePath);
  }
}
