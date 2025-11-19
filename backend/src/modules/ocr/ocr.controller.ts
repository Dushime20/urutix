import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from './ocr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @UseGuards(JwtAuthGuard)
  @Post('extract')
  async extractText(@Body() body: { url: string }) {
    return this.ocrService.extractText(body.url);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndExtract(@UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Check file type
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/pdf',
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type: ${file.mimetype}. Only images and PDFs are allowed.`,
        );
      }

      const result = await this.ocrService.extractFromFile(file);
      return result;
    } catch (error) {
      console.error('OCR upload error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to process file: ${error.message || 'Unknown error'}`,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('extract-document')
  async extractDocumentData(
    @Body() body: { url: string; documentType: string },
  ) {
    return this.ocrService.extractDocumentData(body.url, body.documentType);
  }
}
