// src/modules/info-publication/interceptors/info-publication-files.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class InfoPublicationFilesInterceptor implements NestInterceptor {
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];
  private readonly minFiles = 1;
  private readonly maxFiles = 5;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const files: Express.Multer.File[] = request.files;

    //? Pour la création, les fichiers sont obligatoires
    if (request.method === 'POST') {
      if (!files || files.length === 0) {
        throw new BadRequestException(
          `Au moins ${this.minFiles} image est obligatoire`,
        );
      }
    }

    //? Si des fichiers sont fournis, les valider
    if (files && files.length > 0) {
      // Vérifier le nombre de fichiers
      if (files.length < this.minFiles) {
        throw new BadRequestException(
          `Au moins ${this.minFiles} image est obligatoire`,
        );
      }

      if (files.length > this.maxFiles) {
        throw new BadRequestException(
          `Maximum ${this.maxFiles} images autorisées`,
        );
      }

      //? Valider chaque fichier
      files.forEach((file, index) => {
        // Vérifier le type MIME
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
          throw new BadRequestException(
            `Image ${index + 1}: Type de fichier non autorisé. Types acceptés: JPEG, JPG, PNG, WEBP`,
          );
        }

        //? Vérifier la taille
        if (file.size > this.maxFileSize) {
          throw new BadRequestException(
            `Image ${index + 1}: La taille du fichier dépasse ${this.maxFileSize / 1024 / 1024}MB`,
          );
        }

        //? Vérifier que le fichier n'est pas vide
        if (file.size === 0) {
          throw new BadRequestException(
            `Image ${index + 1}: Le fichier est vide`,
          );
        }
      });
    }

    return next.handle();
  }
}