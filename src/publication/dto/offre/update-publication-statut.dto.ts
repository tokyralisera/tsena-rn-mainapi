import { PublicationStatut } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class UpdatePublicationStatutDto {
    @IsEnum(PublicationStatut, {message: 'Statut de publication invalide'})
    statut: PublicationStatut;

    @IsOptional()
    @IsString()
    commentaire?: string;
}