import { OffreStatut } from "@prisma/client";
import { IsEnum } from "class-validator";

export class UpdateOffreStatutDto {
    @IsEnum(OffreStatut, {message: 'Statut d\'offre invalide'})
    statut: OffreStatut;
}