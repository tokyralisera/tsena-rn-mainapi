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

    console.log('🔧 Interceptor - Body avant le parsing:', body);

    //? Parser villeId
    if (body.villeId) {
      body.villeId = parseInt(body.villeId, 10);
    }

    //? Parser les produits - Gestion du format tableau
    if (Array.isArray(body.produits)) {
      body.produits = body.produits.map((produit: any) => {
        //? Créer un nouvel objet propre
        return {
          libelle: String(produit.libelle || ''),
          prixUnitaire: parseFloat(produit.prixUnitaire || '0'),
          quantite: parseInt(produit.quantite || '0', 10),
          uniteMesure: String(produit.uniteMesure || ''),
          categorieId: parseInt(produit.categorieId || '0', 10),
        };
      });
    } else {
      //? Format avec crochets : produits[0][libelle]
      const produits = [];
      let index = 0;

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

      if (produits.length > 0) {
        body.produits = produits;

        //? Nettoyer les champs form-data originaux
        Object.keys(body).forEach((key) => {
          if (key.startsWith('produits[')) {
            delete body[key];
          }
        });
      }
    }
    return next.handle();
  }
}