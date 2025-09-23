import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UtilisateursService } from './utilisateurs.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UtilisateursController {
  constructor(private utilisateursService: UtilisateursService) {}

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

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.utilisateursService.findById(parseInt(id));
    return { success: true, data: user };
  }
}
