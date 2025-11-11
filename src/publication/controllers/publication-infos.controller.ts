import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/common/types/enums';
import { PublicationInfosService } from '../services/publication-infos.service';
import { CreateInfoPublicationDto } from '../dto/infos/create-info-pub.dto';
import { UpdateInfoPublicationDto } from '../dto/infos/update-info-pub.dto';
import { InfoPublicationFilesInterceptor } from 'src/common/interceptor/info-publication.interceptor';

@Controller('info-publications')
export class PublicationInfoController {
  constructor(private readonly infoPublicationService: PublicationInfosService) {}

  /**
   * 1. Créer une publication d'info utile (Admin/SuperAdmin)
   * POST /info-publications
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UseInterceptors(FilesInterceptor('images', 10), InfoPublicationFilesInterceptor)
  createInfoPublication(
    @Body(ValidationPipe) createInfoPublicationDto: CreateInfoPublicationDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    return this.infoPublicationService.createInfoPublication(
      createInfoPublicationDto,
      files,
      req.user.id,
    );
  }

  /**
   * 2. Récupérer toutes les publications d'infos (tous les utilisateurs)
   * GET /info-publications
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  getAllInfoPublications(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.infoPublicationService.getAllInfoPublications(
      req.user.id,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  /**
   * 3. Récupérer une publication spécifique
   * GET /info-publications/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getInfoPublicationById(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.infoPublicationService.getInfoPublicationById(
      id,
      req.user.id,
    );
  }

  /**
   * 4. Modifier une publication (Admin/SuperAdmin)
   * PUT /info-publications/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @UseInterceptors(FilesInterceptor('images', 10), InfoPublicationFilesInterceptor)
  updateInfoPublication(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateInfoPublicationDto: UpdateInfoPublicationDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    return this.infoPublicationService.updateInfoPublication(
      id,
      updateInfoPublicationDto,
      files,
      req.user.id,
    );
  }

  /**
   * 5. Supprimer une publication (Admin/SuperAdmin)
   * DELETE /info-publications/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  deleteInfoPublication(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.infoPublicationService.deleteInfoPublication(
      id,
      req.user.id,
    );
  }

  /**
   * 6. Liker/Unliker une publication (tous les utilisateurs connectés)
   * POST /info-publications/:id/like
   */
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  toggleLikeInfoPublication(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.infoPublicationService.toggleLikeInfoPublication(
      id,
      req.user.id,
    );
  }
}