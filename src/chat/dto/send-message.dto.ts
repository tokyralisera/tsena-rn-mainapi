import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
    @ApiProperty({
        description: 'ID de la conversation',
        example: 1
    })
    @IsInt()
    @IsNotEmpty()
    conversationId: number;

    @ApiProperty({
        description: 'Contenu du message',
        example: 'Bonjour, je suis intéressé par votre offre'
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    contenu: string;
}