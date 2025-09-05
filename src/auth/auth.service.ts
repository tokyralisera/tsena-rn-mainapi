/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UtilisateursService } from 'src/utilisateurs/utilisateurs.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly utilisateursService: UtilisateursService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUtilisateur(telephone: string, password: string): Promise<any> {
    const user = await this.utilisateursService.findByTelephone(telephone);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    throw new UnauthorizedException('Identifiants invalides');
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUtilisateur(
      loginDto.telephone,
      loginDto.password,
    );

    const payload = {
      username: user.telephone,
      sub: user.id,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nomUtilisateur: user.nomUtilisateur,
        prenomUtilisateur: user.prenomUtilisateur,
        telephone: user.telephone,
        role: user.role,
        langue: user.langue,
        sexe: user.sexe,
        isActive: user.isActive,
      },
    };
  }

  async publicRegister(registerDto: RegisterDto) {
    const userCount = await this.prisma.utilisateur.count();
    const isFirstUser = userCount === 0;

    const role = isFirstUser ? Role.SUPERADMIN : Role.USER;

    const registerData = {
      ...registerDto,
      role: role,
    };

    return this.createUtilisateur(registerDto, isFirstUser);
  }

  async adminRegister(registerDto: RegisterDto) {
    return this.createUtilisateur(registerDto, false);
  }

  private async createUtilisateur(
    registerDto: RegisterDto,
    isFirstUser: boolean,
  ) {
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { telephone: registerDto.telephone },
    });
    if (existingUser) {
      throw new ConflictException('Numero de telephone deja utilise');
    }
    const existingNif = await this.prisma.utilisateur.findUnique({
      where: { NIF: registerDto.NIF },
    });
    if (existingNif) {
      throw new ConflictException('NIF deja attribue a un utilisateur');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.utilisateur.create({
      data: {
        nomUtilisateur: registerDto.nomUtilisateur,
        prenomUtilisateur: registerDto.prenomUtilisateur,
        NIF: registerDto.NIF,
        STAT: registerDto.STAT,
        telephone: registerDto.telephone,
        password: hashedPassword,
        role: registerDto.role as Role, 
        sexe: registerDto.sexe,
        langue: registerDto.langue,
      },
    });

    const { password, ...result } = user;

    return {
      success: true,
      statusCode: 201,
      user: result,
      isFirstUser: isFirstUser,
      message: isFirstUser
        ? 'Premier utilisateur cree avec succes'
        : 'Utilisateur cree avec succes',
    };
  }

  async countUsers(): Promise<number> {
    return this.prisma.utilisateur.count();
  }
}