import { Module } from '@nestjs/common';
import { VilleController } from './ville.controller';
import { VilleService } from './ville.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VilleController],
  providers: [VilleService],
  exports: [VilleService]
})
export class VilleModule {}
