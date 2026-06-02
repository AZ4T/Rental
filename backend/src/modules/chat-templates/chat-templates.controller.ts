import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Put,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ChatTemplatesService } from './chat-templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('chat-templates')
export class ChatTemplatesController {
    constructor(private templates: ChatTemplatesService) {}

    @Get()
    list(@Req() req: Request & { user: { userId: string } }) {
        return this.templates.list(req.user.userId);
    }

    @Post()
    create(
        @Req() req: Request & { user: { userId: string } },
        @Body() body: { text: string },
    ) {
        return this.templates.create(req.user.userId, body.text);
    }

    @Patch(':id')
    update(
        @Req() req: Request & { user: { userId: string } },
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: { text: string },
    ) {
        return this.templates.update(req.user.userId, id, body.text);
    }

    @Delete(':id')
    delete(
        @Req() req: Request & { user: { userId: string } },
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.templates.delete(req.user.userId, id);
    }

    @Put('reorder')
    reorder(
        @Req() req: Request & { user: { userId: string } },
        @Body() body: { ids: string[] },
    ) {
        return this.templates.reorder(req.user.userId, body.ids ?? []);
    }
}
