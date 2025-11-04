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

@Controller('publications/demandes')
export class PublicationDemandeController {
  constructor(
    private readonly publicationDemandeService: PublicationDemandeService,
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
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('statut') statut?: PublicationStatut,
    @Query('demandeStatut') demandeStatut?: StatutDemande,
    @Query('categorieId', new ParseIntPipe({ optional: true }))
    categorieId?: number,
    @Query('villeId', new ParseIntPipe({ optional: true })) villeId?: number,
    @Query('paysId', new ParseIntPipe({ optional: true })) paysId?: number,
    @Query('search') search?: string,
    @Query('auteurId', new ParseIntPipe({ optional: true }))
    auteurId?: number,
    @Query('budgetMin', new ParseIntPipe({ optional: true }))
    budgetMin?: number,
    @Query('budgetMax', new ParseIntPipe({ optional: true }))
    budgetMax?: number,
    @Query('sortBy') sortBy?: 'createdAt' | 'updatedAt' | 'titre' | 'deadline',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.publicationDemandeService.findAllWithFilters({
      page,
      limit,
      statut,
      demandeStatut,
      categorieId,
      villeId,
      paysId,
      search,
      auteurId,
      budgetMin,
      budgetMax,
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
   * Récupérer mes demandes (USER)
   * GET /publications/demandes/my-demandes
   */
  @Get('my-demandes')
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
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('demandeStatut') demandeStatut?: StatutDemande,
    @Query('categorieId', new ParseIntPipe({ optional: true }))
    categorieId?: number,
    @Query('budgetMin', new ParseIntPipe({ optional: true }))
    budgetMin?: number,
    @Query('budgetMax', new ParseIntPipe({ optional: true }))
    budgetMax?: number,
  ) {
    return this.publicationDemandeService.findAllWithFilters({
      villeId,
      page,
      limit,
      demandeStatut,
      categorieId,
      budgetMin,
      budgetMax,
      statut: PublicationStatut.VALIDE, // Seulement les demandes validées
    });
  }

  /**
   * Récupérer les demandes par pays (PUBLIC)
   * GET /publications/demandes/pays/:paysId
   */
  @Get('pays/:paysId')
  findByPays(
    @Param('paysId', ParseIntPipe) paysId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('demandeStatut') demandeStatut?: StatutDemande,
    @Query('categorieId', new ParseIntPipe({ optional: true }))
    categorieId?: number,
    @Query('budgetMin', new ParseIntPipe({ optional: true }))
    budgetMin?: number,
    @Query('budgetMax', new ParseIntPipe({ optional: true }))
    budgetMax?: number,
  ) {
    return this.publicationDemandeService.findAllWithFilters({
      paysId,
      page,
      limit,
      demandeStatut,
      categorieId,
      budgetMin,
      budgetMax,
      statut: PublicationStatut.VALIDE, // Seulement les demandes validées
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