import { PublicationStatut, OffreStatut } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

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
}