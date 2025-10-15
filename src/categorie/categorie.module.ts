import { Module } from '@nestjs/common';
import { CategorieController } from './categorie.controller';
import { CategorieService } from './categorie.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CategorieController],
  providers: [CategorieService],
  exports: [CategorieService]
})
export class CategorieModule {}
