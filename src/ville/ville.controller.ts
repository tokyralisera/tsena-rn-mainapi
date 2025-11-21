import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VilleService } from './ville.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/common/types/enums';
import { CreateVilleDto } from './dto/create-ville.dto';
import { UpdateVilleDto } from './dto/update-ville.dto';

@Controller('ville')
export class VilleController {
  constructor(private readonly villeService: VilleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async create(@Body() dto: CreateVilleDto) {
    return this.villeService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
async findAll(@Query('paysId') paysId?: string) {
  const parsedPaysId = paysId ? parseInt(paysId, 10) : undefined;
  return this.villeService.findAll(parsedPaysId);
}

  @Get('pays/:paysId')
  @HttpCode(HttpStatus.OK)
  async findByPays(@Param('paysId', ParseIntPipe) paysId: number) {
    return this.villeService.findByPays(paysId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.villeService.findOne(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVilleDto,
  ) {
    return this.villeService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.villeService.delete(id);
  }
}
