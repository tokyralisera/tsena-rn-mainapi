import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Delete,
  Request,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UtilisateursService } from './utilisateurs.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Utilisateur } from '@prisma/client';
import { Role } from 'src/common/types/enums';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UtilisateursController {
  constructor(private utilisateursService: UtilisateursService) { }

  @Get('profile')
  async getProfile(@Request() req): Promise<{
    success: boolean;
    data: Omit<Utilisateur, 'password'>;
  }> {
    const user = await this.utilisateursService.findById(req.user.id);
    return { success: true, data: user };
  }

  @Put('profile')
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updateUser = await this.utilisateursService.updateProfile(
      req.user.id,
      updateProfileDto,
    );
    return {
      success: true,
      message: 'Profil mis a jour avec succes',
      data: updateUser,
    };
  }

  /**
   * Récupérer tous les utilisateurs (SUPERADMIN)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  async getAllUsers(@Query() query: GetUsersQueryDto) {
    const result = await this.utilisateursService.findAll(query);
    return {
      success: true,
      ...result,
    };
  }

  /**
   * Obtenir les statistiques (SUPERADMIN)
   */
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  async getUsersStats() {
    const stats = await this.utilisateursService.getUsersStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Récupérer un utilisateur par ID (SUPERADMIN)
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  async getUserById(@Param('id') id: string) {
    const user = await this.utilisateursService.findByIdWithCount(parseInt(id));
    return { success: true, data: user };
  }

  /**
   * Changer le rôle d'un utilisateur (SUPERADMIN)
   */
  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Request() req,
  ) {
    const updatedUser = await this.utilisateursService.updateUserRole(
      parseInt(id),
      updateRoleDto,
      req.user.id,
    );
    return {
      success: true,
      message: 'Rôle modifié avec succès',
      data: updatedUser,
    };
  }

  /**
   * Supprimer un utilisateur (SUPERADMIN)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  async deleteUser(@Param('id') id: string, @Request() req) {
    await this.utilisateursService.deleteUser(parseInt(id), req.user.id);
    return {
      success: true,
      message: 'Utilisateur supprimé avec succès',
    };
  }
}