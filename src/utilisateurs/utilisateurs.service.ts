import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Utilisateur } from './entitites/user.entity';
import { Langue, Role, Sexe } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UtilisateursService {
  constructor(private readonly prismaService: PrismaService) {}

  async findByTelephone(telephone: string): Promise<Utilisateur | null> {
    const user = await this.prismaService.utilisateur.findUnique({
      where: { telephone },
    });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouve');
    }
    return user;
  }

  async createUtilisateur(userData: {
    nomUtilisateur: string;
    prenomUtilisateur: string;
    NIF: string;
    STAT: string;
    telephone: string;
    password: string;
    role: Role;
    sexe: Sexe;
    langue: Langue;
    isActive: boolean;
  }): Promise<Utilisateur> {
    return this.prismaService.utilisateur.create({ data: userData });
  }

  async findById(id: number): Promise<Omit<Utilisateur, 'password'> | null> {
    const user = await this.prismaService.utilisateur.findUnique({
      where: { id },
      select: {
        id: true,
        nomUtilisateur: true,
        prenomUtilisateur: true,
        NIF: true,
        STAT: true,
        telephone: true,
        role: true,
        sexe: true,
        langue: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur non trouvee`);
    }

    return user;
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const user = await this.prismaService.utilisateur.findUnique({
      where:{ id: userId}
    })

    if(!user) { throw new NotFoundException('Utilisateur non trouvee')}

    //Verifier si le numero telephone a ete deja assignee a un utlisateur
    if(updateProfileDto.telephone && updateProfileDto.telephone !== user.telephone){
      const existingUser = await this.prismaService.utilisateur.findUnique({where: { telephone: updateProfileDto.telephone}})

      if(existingUser) { throw new ConflictException('Numero de telephone deja utilisee')}
    }

    //Verifier si le numero NIF a ete deja assignee a un utlisateur
    if(updateProfileDto.NIF && updateProfileDto.NIF !== user.NIF){
      const existingUser = await this.prismaService.utilisateur.findUnique({where: { NIF: updateProfileDto.NIF}})

      if(existingUser) { throw new ConflictException('Numero NIF deja utilisee')}
    }

    //Verifier si le numero STAT a ete deja assignee a un utlisateur
    if(updateProfileDto.STAT && updateProfileDto.STAT !== user.STAT){
      const existingUser = await this.prismaService.utilisateur.findUnique({where: { STAT: updateProfileDto.STAT}})

      if(existingUser) { throw new ConflictException('Numero STAT deja utilisee')}
    }

    const updateUser = await this.prismaService.utilisateur.update({
      where: {id: userId},
      data: updateProfileDto
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {password, ...result} = updateUser;
    return result;
  }
}
