import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class TransformDemandeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    console.log('🔧 Interceptor Demande - Body avant le parsing:', body);

    //? Parser villeId
    if (body.villeId) {
      body.villeId = parseInt(body.villeId, 10);
    }

    //? Parser budgetMin
    if (body.budgetMin) {
      body.budgetMin = parseFloat(body.budgetMin);
    }

    //? Parser budgetMax
    if (body.budgetMax) {
      body.budgetMax = parseFloat(body.budgetMax);
    }

    //? Parser les produits - Gestion du format tableau
    if (Array.isArray(body.produits)) {
      body.produits = body.produits.map((produit: any) => {
        //? Créer un nouvel objet propre
        const transformed: any = {
          nom: String(produit.nom || ''),
          categorieId: parseInt(produit.categorieId || '0', 10),
        };

        // Quantité optionnelle
        if (produit.quantite !== undefined && produit.quantite !== null && produit.quantite !== '') {
          transformed.quantite = parseInt(produit.quantite, 10);
        }

        // Unité de mesure optionnelle
        if (produit.uniteMesure) {
          transformed.uniteMesure = String(produit.uniteMesure);
        }

        return transformed;
      });
    } else {
      //? Format avec crochets : produits[0][nom]
      const produits = [];
      let index = 0;

      while (body[`produits[${index}][nom]`]) {
        const produit: any = {
          nom: body[`produits[${index}][nom]`],
          categorieId: parseInt(body[`produits[${index}][categorieId]`], 10),
        };

        // Quantité optionnelle
        if (body[`produits[${index}][quantite]`]) {
          produit.quantite = parseInt(body[`produits[${index}][quantite]`], 10);
        }

        // Unité de mesure optionnelle
        if (body[`produits[${index}][uniteMesure]`]) {
          produit.uniteMesure = body[`produits[${index}][uniteMesure]`];
        }

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

    console.log('🔧 Interceptor Demande - Body après le parsing:', body);

    return next.handle();
  }
}