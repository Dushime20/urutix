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
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only images and PDFs are allowed.',
      );
    }

    return this.ocrService.extractFromFile(file);
  }

  @UseGuards(JwtAuthGuard)
  @Post('extract-document')
  async extractDocumentData(
    @Body() body: { url: string; documentType: string },
  ) {
    return this.ocrService.extractDocumentData(body.url, body.documentType);
  }
}
