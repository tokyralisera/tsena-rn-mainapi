import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { PublicationStatut, StatutDemande } from '@prisma/client';

@Injectable()
export class PublicationDemandeSchedulerService {
  private readonly logger = new Logger(PublicationDemandeSchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cron job qui s'exécute tous les jours à minuit (00:00)
   * Pour marquer les demandes expirées
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredDemandes() {
    this.logger.log('Début de la vérification des demandes expirées...');

    try {
      const now = new Date();

      //? Trouver toutes les demandes validées, non trouvées et avec deadline passée
      const expiredDemandes = await this.prisma.demande.findMany({
        where: {
          statutDemande: StatutDemande.NON_TROUVEE,
          deadline: {
            lt: now, // Deadline < maintenant
            not: null,
          },
          publication: {
            statut: PublicationStatut.VALIDE,
          },
        },
        include: {
          publication: {
            select: {
              id: true,
              titre: true,
            },
          },
        },
      });

      if (expiredDemandes.length === 0) {
        this.logger.log('Aucune demande expirée trouvée');
        return;
      }

      this.logger.log(
        `${expiredDemandes.length} demande(s) expirée(s) trouvée(s)`,
      );

      //? Mettre à jour le statut de chaque demande expirée
      const updatePromises = expiredDemandes.map((demande) =>
        this.prisma.demande.update({
          where: { id: demande.id },
          data: { statutDemande: StatutDemande.EXPIREE },
        }),
      );

      await Promise.all(updatePromises);

      this.logger.log(
        `${expiredDemandes.length} demande(s) marquée(s) comme EXPIREE`,
      );

      //? Log détaillé de chaque demande expirée
      expiredDemandes.forEach((demande) => {
        this.logger.debug(
          `  - Demande #${demande.publication.id}: "${demande.publication.titre}" (deadline: ${demande.deadline})`,
        );
      });
    } catch (error) {
      this.logger.error(
        'Erreur lors de la vérification des demandes expirées',
        error,
      );
    }
  }

  /**
   * Méthode manuelle pour tester le cron job
   * Peut être appelée via un endpoint admin pour tester
   */
  async checkExpiredDemandesManually() {
    this.logger.log('Vérification manuelle des demandes expirées...');
    return this.handleExpiredDemandes();
  }
}