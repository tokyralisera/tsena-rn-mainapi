import { PublicationStatut, OffreStatut } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FilterPublicationOffreDto {
  @IsOptional()
  @IsEnum(PublicationStatut)
  statut?: PublicationStatut;

  @IsOptional()
  @IsEnum(OffreStatut)
  offreStatut?: OffreStatut;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categorieId?: number;

  @IsOptional()
  @IsInt({ message: "L'ID de la ville doit être un nombre entier" })
  @Type(() => Number)
  villeId?: number;

  @IsOptional()
  @IsInt({ message: "L'ID du pays doit être un nombre entier" })
  @Type(() => Number)
  paysId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  auteurId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['asc', 'desc'], {
    message: 'L\'ordre de tri doit être "asc" ou "desc"',
  })
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'titre'], {
    message: 'Le champ de tri doit être "createdAt", "updatedAt" ou "titre"',
  })
  sortBy?: 'createdAt' | 'updatedAt' | 'titre' = 'createdAt';
}
