import { UpdatePublicationStatutDto } from './../dto/offre/update-publication-statut.dto';
import { GetUser } from './../../auth/decorators/get-user.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PublicationOffreService } from '../services/publication-offre.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreatePublicationOffreDto } from '../dto/offre/create-publication-offre.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/common/types/enums';
import { FilterPublicationOffreDto } from '../dto/offre/filter-publication-offre.dto';
import { PublicationStatut } from '@prisma/client';
import { UpdatePublicationOffreDto } from '../dto/offre/update-publication-offre.dto';
import { UpdateOffreStatutDto } from '../dto/offre/update-offre-statut.dto';
import { ParseFormDataInterceptor } from 'src/common/interceptor/parse-form-data.interceptor';

@Controller('publications/offres')
export class PublicationOffreController {
  constructor(
    private readonly publicationOffreService: PublicationOffreService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ParseFormDataInterceptor)
  @UseInterceptors(FilesInterceptor('files', 5))
  async create(
    @Body() dto: CreatePublicationOffreDto,
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser('id') userId: number,
  ) {
    return this.publicationOffreService.create(dto, files, userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAllPublic(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.publicationOffreService.findAllPublic(
      page ? parseInt(page.toString(), 10) : 1,
      limit ? parseInt(limit.toString(), 10) : 10,
    );
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  async searchWithFilters(@Query() filters: FilterPublicationOffreDto) {
    return this.publicationOffreService.findAllWithFilters(filters);
  }

  @Get('admin')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async findAllForAdmin(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('statut') statut?: PublicationStatut,
  ) {
    return this.publicationOffreService.findAllForAdmin(
      page ? parseInt(page.toString(), 10) : 1,
      limit ? parseInt(limit.toString(), 10) : 10,
      statut,
    );
  }

  @Get('admin/statistics')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async getStats() {
    return this.publicationOffreService.getStatistics();
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async findMyPublications(
    @GetUser('id') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.publicationOffreService.findMyPublications(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
    @GetUser('role') userRole?: Role,
  ) {
    return this.publicationOffreService.findOne(id, userId, userRole);
  }

  @Get('ville/:villeId')
  @HttpCode(HttpStatus.OK)
  async findByVille(
    @Param('villeId', ParseIntPipe) villeId: number,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.publicationOffreService.findAllWithFilters({
      villeId,
      page: page ? parseInt(page.toString(), 10) : 1,
      limit: limit ? parseInt(limit.toString(), 10) : 10,
    });
  }

  @Get('pays/:paysId')
  @HttpCode(HttpStatus.OK)
  async findByPays(
    @Param('paysId', ParseIntPipe) paysId: number,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.publicationOffreService.findAllWithFilters({
      paysId,
      page: page ? parseInt(page.toString(), 10) : 1,
      limit: limit ? parseInt(limit.toString(), 10) : 10,
    });
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ParseFormDataInterceptor)
  @UseInterceptors(FilesInterceptor('files', 5))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePublicationOffreDto,
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser('id') userId: number,
  ) {
    return this.publicationOffreService.update(id, dto, files, userId);
  }

  @Patch(':id/statut')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async updateStatut(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePublicationStatutDto,
  ) {
    return this.publicationOffreService.updateStatut(id, dto);
  }

  @Patch(':id/offre-statut')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async updateOffreStatut(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOffreStatutDto,
    @GetUser('id') userId: number,
  ) {
    return this.publicationOffreService.updateOffreStatut(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
    @GetUser('role') userRole: Role,
  ) {
    return this.publicationOffreService.delete(id, userId, userRole);
  }
}
