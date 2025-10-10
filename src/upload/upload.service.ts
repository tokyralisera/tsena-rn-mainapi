import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadService {
  uploadImage(
    file: Express.Multer.File,
    folder: string = 'publications',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      //Validation du type de fichier
      if (!file.mimetype.startsWith('image/')) {
        reject(new BadRequestException('Le fichier doit etre une image'));
        return;
      }

      //Validation de la taille du fichier
      const maxSize = 5 * 1024 * 1024; //5Mb
      if (file.size > maxSize) {
        reject(
          new BadRequestException(
            'La taille du fichier ne doit pas depasser 5Mb',
          ),
        );
        return;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' }, // Redimensionnement automatique
            { quality: 'auto:good' }, // Optimisation automatique de la qualité
            { fetch_format: 'auto' }, // Format automatique (WebP si supporté)
          ],
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            reject(
              new InternalServerErrorException(
                "Erreur lors de l'upload de l'image",
              ),
            );
          } else {
            resolve(result);
          }
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async uploadMultipleImage(
    files: Express.Multer.File[],
    folder: string = 'publications',
  ) {
    try {
      //Validation au max 5 images
      if (files.length > 5) {
        throw new BadRequestException(
          'Vous ne pouvez uploader que 5 images maximum',
        );
      }
      if (files.length === 0) {
        throw new BadRequestException('Aucun fichier fourni');
      }

      const UploadPromises = files.map((file) =>
        this.uploadImage(file, folder),
      );
      const results = await Promise.all(UploadPromises);

      // Extraction des URLs et informations
      const urls = results.map((result) => result.secure_url);
      const filesInfo = results.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      }));
      return {
        success: true,
        statusCode: 201,
        message: `${files.length} image(s) uploadée(s) avec succès`,
        data: {
          urls,
          files: filesInfo,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Erreur lors de l'upload des images",
      );
    }
  }

  async deleteImage(publicId: string) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result === 'ok') {
        return {
          success: true,
          statusCode: 200,
          message: 'Image supprimée avec succès',
        };
      } else {
        throw new BadRequestException('Image non trouvee ou deja supprimee');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erreur lors de la suppression');
    }
  }

  async deleteMultipleImage(publicIds: string[]) {
    try {
      const deletePromises = publicIds.map((publicIds) =>
        cloudinary.uploader.destroy(publicIds),
      );
      await Promise.all(deletePromises);
      return {
        success: true,
        statusCode: 200,
        message: `${publicIds.length} image(s) supprimée(s) avec succès`,
      };
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la suppression des images',
      );
    }
  }
}
