import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../auth/decorators/role.decorator';
import { CreateCategoryDto } from '../categories/dto/create-category.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Role('ADMIN')
@Controller('admin')
export class AdminController {
    constructor(private adminService: AdminService) {}

    @Get('users')
    getAllUsers() {
        return this.adminService.getAllUsers();
    }

    @Delete('users/:id')
    deleteUser(@Param('id') id: string) {
        return this.adminService.deleteUser(id);
    }

    @Delete('listings/:id')
    deleteListing(@Param('id') id: string) {
        return this.adminService.deleteListing(id);
    }

    @Post('categories')
    createCategory(@Body() dto: CreateCategoryDto) {
        return this.adminService.createCategory(dto);
    }

    @Delete('categories/:id')
    deleteCategory(@Param('id') id: string) {
        return this.adminService.deleteCategory(id);
    }
}
