import { IsEnum, IsNotEmpty } from 'class-validator';
import { StatutDemande } from '@prisma/client';

export class UpdateDemandeStatutDto {
  @IsEnum(StatutDemande, {
    message: 'Le statut doit être TROUVEE, NON_TROUVEE ou EXPIREE',
  })
  @IsNotEmpty({ message: 'Le statut est obligatoire' })
  statut: StatutDemande;
}