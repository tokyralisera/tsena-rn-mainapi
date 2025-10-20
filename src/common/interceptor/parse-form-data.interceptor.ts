import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ParseFormDataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    //? Parser villeId
    if (body.villeId) {
      body.villeId = parseInt(body.villeId, 10);
    }

    //? Parser les produits
    const produits = [];
    let index = 0;

    //? Boucle pour récupérer tous les produits (produits[0], produits[1], etc.)
    while (body[`produits[${index}][libelle]`]) {
      const produit = {
        libelle: body[`produits[${index}][libelle]`],
        prixUnitaire: parseFloat(body[`produits[${index}][prixUnitaire]`]),
        quantite: parseInt(body[`produits[${index}][quantite]`], 10),
        uniteMesure: body[`produits[${index}][uniteMesure]`],
        categorieId: parseInt(body[`produits[${index}][categorieId]`], 10),
      };

      produits.push(produit);
      index++;
    }

    //? Remplacer les champs individuels par un tableau
    if (produits.length > 0) {
      body.produits = produits;

      //? Nettoyer les champs form-data originaux
      Object.keys(body).forEach((key) => {
        if (key.startsWith('produits[')) {
          delete body[key];
        }
      });
    }

    return next.handle();
  }
}
