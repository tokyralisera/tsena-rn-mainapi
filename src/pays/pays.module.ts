import { Module } from '@nestjs/common';
import { PaysController } from './pays.controller';
import { PaysService } from './pays.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaysController],
  providers: [PaysService],
  exports: [PaysService]
})
export class PaysModule {}
