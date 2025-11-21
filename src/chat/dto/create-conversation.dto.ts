import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
    @ApiProperty({
        description: 'ID de la publication qui déclenche la conversation',
        example: 1
    })
    @IsInt()
    @IsNotEmpty()
    publicationId: number;
}