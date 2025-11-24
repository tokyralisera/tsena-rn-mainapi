import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
  ParseIntPipe,
  ValidationPipe,
  Request,
} from '@nestjs/common';

import { CreatePublicationDemandeDto } from '../dto/demande/create-publication-demande.dto';
import { UpdatePublicationDemandeDto } from '../dto/demande/update-publication-demande.dto';
import { UpdatePublicationStatutDto } from '../dto/offre/update-publication-statut.dto';
import { UpdateDemandeStatutDto } from '../dto/demande/update-demande-statut.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/common/types/enums';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PublicationStatut, StatutDemande } from '@prisma/client';
import { PublicationDemandeService } from '../services/publication-demande.service';
import { TransformDemandeInterceptor } from 'src/common/interceptor/transform-demande.interceptor';
import { PublicationDemandeSchedulerService } from '../services/publication-demande-scheduler.service';

@Controller('publications/demandes')
export class PublicationDemandeController {
  constructor(
    private readonly publicationDemandeService: PublicationDemandeService,
    private readonly schedulerService: PublicationDemandeSchedulerService
  ) { }

  /**
   * Créer une demande (USER)
   * POST /publications/demandes
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5), TransformDemandeInterceptor)
  create(
    @Body(ValidationPipe) createPublicationDemandeDto: CreatePublicationDemandeDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    return this.publicationDemandeService.create(
      createPublicationDemandeDto,
      files,
      req.user.id,
    );
  }

  /**
   * Récupérer toutes les demandes validées (PUBLIC)
   * GET /publications/demandes
   */
  @Get()
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.publicationDemandeService.findAllPublic(page, limit);
  }

  /**
   * Récupérer toutes les demandes avec filtres avancés (PUBLIC)
   * GET /publications/demandes/search
   */
  @Get('search')
  findAllWithFilters(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('statut') statut?: PublicationStatut,
    @Query('demandeStatut') demandeStatut?: StatutDemande,
    @Query('categorieId') categorieId?: string,
    @Query('villeId') villeId?: string,
    @Query('paysId') paysId?: string,
    @Query('search') search?: string,
    @Query('auteurId') auteurId?: string,
    @Query('budgetMin') budgetMin?: string,
    @Query('budgetMax') budgetMax?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'updatedAt' | 'titre' | 'deadline',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.publicationDemandeService.findAllWithFilters({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      statut,
      demandeStatut,
      categorieId: categorieId ? parseInt(categorieId, 10) : undefined,
      villeId: villeId ? parseInt(villeId, 10) : undefined,
      paysId: paysId ? parseInt(paysId, 10) : undefined,
      search,
      auteurId: auteurId ? parseInt(auteurId, 10) : undefined,
      budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
      budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
      sortBy,
      sortOrder,
    });
  }

  /**
   * Récupérer toutes les demandes pour admin (ADMIN/SUPERADMIN)
   * GET /publications/demandes/admin
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  findAllForAdmin(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('statut') statut?: PublicationStatut,
  ) {
    return this.publicationDemandeService.findAllForAdmin(page, limit, statut);
  }

  /**
   * Récupérer les statistiques des demandes (ADMIN/SUPERADMIN)
   * GET /publications/demandes/admin/statistics
   */
  @Get('admin/statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  getStatistics() {
    return this.publicationDemandeService.getStatistics();
  }

  /**
 * Vérifier manuellement les demandes expirées (ADMIN/SUPERADMIN)
 * POST /publications/demandes/admin/check-expired
 */
  @Post('admin/check-expired')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async checkExpiredDemandes() {
    await this.schedulerService.checkExpiredDemandesManually();
    return {
      success: true,
      statusCode: 200,
      message: 'Vérification des demandes expirées effectuée avec succès',
    };
  }

  /**
   * Récupérer mes demandes (USER)
   * GET /publications/demandes/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMyPublications(
    @Request() req,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.publicationDemandeService.findMyPublications(
      req.user.id,
      page,
      limit,
    );
  }

  /**
 * Récupérer les demandes par ville (PUBLIC)
 * GET /publications/demandes/ville/:villeId
 */
  @Get('ville/:villeId')
  findByVille(
    @Param('villeId', ParseIntPipe) villeId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('demandeStatut') demandeStatut?: StatutDemande,
    @Query('categorieId') categorieId?: string,
    @Query('budgetMin') budgetMin?: string,
    @Query('budgetMax') budgetMax?: string,
  ) {
    return this.publicationDemandeService.findAllWithFilters({
      villeId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      demandeStatut,
      categorieId: categorieId ? parseInt(categorieId, 10) : undefined,
      budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
      budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
      statut: PublicationStatut.VALIDE,
    });
  }

  /**
   * Récupérer les demandes par pays (PUBLIC)
   * GET /publications/demandes/pays/:paysId
   */
  @Get('pays/:paysId')
  findByPays(
    @Param('paysId', ParseIntPipe) paysId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('demandeStatut') demandeStatut?: StatutDemande,
    @Query('categorieId') categorieId?: string,
    @Query('budgetMin') budgetMin?: string,
    @Query('budgetMax') budgetMax?: string,
  ) {
    return this.publicationDemandeService.findAllWithFilters({
      paysId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      demandeStatut,
      categorieId: categorieId ? parseInt(categorieId, 10) : undefined,
      budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
      budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
      statut: PublicationStatut.VALIDE,
    });
  }

  /**
   * Récupérer une demande par ID (PUBLIC/USER/ADMIN)
   * GET /publications/demandes/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    return this.publicationDemandeService.findOne(id, userId, userRole);
  }

  /**
   * Modifier une demande (USER - Auteur uniquement)
   * PATCH /publications/demandes/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5), TransformDemandeInterceptor)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updatePublicationDemandeDto: UpdatePublicationDemandeDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    return this.publicationDemandeService.update(
      id,
      updatePublicationDemandeDto,
      files,
      req.user.id,
    );
  }

  /**
   * Modifier le statut de publication (ADMIN/SUPERADMIN)
   * PATCH /publications/demandes/:id/statut
   */
  @Patch(':id/statut')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  updateStatut(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updatePublicationStatutDto: UpdatePublicationStatutDto,
  ) {
    return this.publicationDemandeService.updateStatut(
      id,
      updatePublicationStatutDto,
    );
  }

  /**
   * Modifier le statut de la demande - TROUVEE/NON_TROUVEE/EXPIREE (USER - Auteur uniquement)
   * PATCH /publications/demandes/:id/demande-statut
   */
  @Patch(':id/demande-statut')
  @UseGuards(JwtAuthGuard)
  updateDemandeStatut(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateDemandeStatutDto: UpdateDemandeStatutDto,
    @Request() req,
  ) {
    return this.publicationDemandeService.updateDemandeStatut(
      id,
      updateDemandeStatutDto,
      req.user.id,
    );
  }

  /**
   * Supprimer une demande (USER - Auteur ou ADMIN/SUPERADMIN)
   * DELETE /publications/demandes/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.publicationDemandeService.delete(
      id,
      req.user.id,
      req.user.role,
    );
  }
}