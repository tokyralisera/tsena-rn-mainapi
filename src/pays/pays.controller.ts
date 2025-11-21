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
  UseGuards,
} from '@nestjs/common';
import { PaysService } from './pays.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/common/types/enums';
import { CreatePaysDto } from './dto/create-pays.dto';
import { UpdatePaysDto } from './dto/update-pays.dto';

@Controller('pays')
export class PaysController {
  constructor(private readonly paysService: PaysService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async create(@Body() dto: CreatePaysDto) {
    return this.paysService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.paysService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paysService.findOne(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaysDto,
  ) {
    return this.paysService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.paysService.delete(id);
  }
}
