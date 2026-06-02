import { Module } from '@nestjs/common';
import { ChatTemplatesService } from './chat-templates.service';
import { ChatTemplatesController } from './chat-templates.controller';

@Module({
    providers: [ChatTemplatesService],
    controllers: [ChatTemplatesController],
})
export class ChatTemplatesModule {}
