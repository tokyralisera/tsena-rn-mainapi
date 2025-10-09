import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingleImage(@UploadedFile() file: Express.Multer.File) {
    const result = await this.uploadService.uploadImage(file);
    return {
      success: true,
      statusCode: 201,
      message: 'Image uploadee avec succes',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      },
    };
  }

  @Post('images')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadMultipleImages(@UploadedFile() files: Express.Multer.File[]) {
    return this.uploadService.uploadMultipleImage(files);
  }

  @Delete('image')
  @HttpCode(HttpStatus.OK)
  async deleteImage(@Body('publicId') publicId: string) {
    return this.uploadService.deleteImage(publicId);
  }

  @Delete('images')
  @HttpCode(HttpStatus.OK)
  async deleteMultipleImage(@Body('publicIds') publicIds: string[]) {
    return this.uploadService.deleteMultipleImage(publicIds);
  }
}
