import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkAsReadDto {
    @ApiProperty({
        description: 'ID de la conversation à marquer comme lue',
        example: 1
    })
    @IsInt()
    @IsNotEmpty()
    conversationId: number;
}