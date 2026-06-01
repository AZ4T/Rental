import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { DisputeStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { OpenDisputeDto, AddEvidenceDto } from './dto/open-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class DisputesService {
    constructor(
        private prisma: PrismaService,
        private notificationsGateway: NotificationsGateway,
        private uploadsService: UploadsService,
    ) {}

    async open(dto: OpenDisputeDto, userId: string) {
        const rental = await this.prisma.rentalRequest.findUnique({
            where: { id: dto.rental_request_id },
            include: { listing: true },
        });
        if (!rental) throw new NotFoundException('Аренда не найдена');

        const isRenter = rental.renter_id === userId;
        const isOwner = rental.listing.owner_id === userId;
        if (!isRenter && !isOwner) {
            throw new ForbiddenException('Вы не участник этой аренды');
        }

        if (rental.payment_status !== 'PAID') {
            throw new BadRequestException('Спор можно открыть только по оплаченной аренде');
        }

        // Disallow disputes once rental is already fully completed (deposit already moved).
        // The renter must dispute BEFORE owner clicks "complete".
        if (rental.status === 'COMPLETED') {
            throw new BadRequestException('Аренда уже завершена — спор больше не открыть');
        }
        if (rental.status !== 'APPROVED') {
            throw new BadRequestException('Спор доступен только для активных аренд');
        }

        const existing = await this.prisma.dispute.findUnique({
            where: { rental_request_id: dto.rental_request_id },
        });
        if (existing) {
            throw new ConflictException('Спор уже открыт');
        }

        // Validate evidence URLs are from our storage
        if (dto.evidence?.length) {
            const prefix = this.uploadsService.getPublicPrefix();
            if (dto.evidence.some((url) => !url.startsWith(prefix))) {
                throw new BadRequestException('Недопустимые URL доказательств');
            }
        }

        const dispute = await this.prisma.dispute.create({
            data: {
                rental_request_id: dto.rental_request_id,
                opened_by_id: userId,
                reason: dto.reason,
                description: dto.description,
                renter_evidence: isRenter ? (dto.evidence ?? []) : [],
                owner_evidence: isOwner ? (dto.evidence ?? []) : [],
            },
        });

        // Notify the OTHER party so they can respond with their evidence
        const otherUserId = isRenter ? rental.listing.owner_id : rental.renter_id;
        this.notificationsGateway.sendToUser(otherUserId, 'dispute_opened', {
            message: `Открыт спор по аренде "${rental.listing.title}". Добавьте свои доказательства.`,
            rentalRequestId: rental.id,
            disputeId: dispute.id,
        });

        return dispute;
    }

    async addEvidence(disputeId: string, dto: AddEvidenceDto, userId: string) {
        const dispute = await this.prisma.dispute.findUnique({
            where: { id: disputeId },
            include: { rentalRequest: { include: { listing: true } } },
        });
        if (!dispute) throw new NotFoundException('Спор не найден');
        if (dispute.status !== 'OPEN') {
            throw new BadRequestException('Спор уже закрыт — нельзя добавить доказательства');
        }

        const isRenter = dispute.rentalRequest.renter_id === userId;
        const isOwner = dispute.rentalRequest.listing.owner_id === userId;
        if (!isRenter && !isOwner) {
            throw new ForbiddenException('Нет доступа к этому спору');
        }

        const prefix = this.uploadsService.getPublicPrefix();
        if (dto.images.some((url) => !url.startsWith(prefix))) {
            throw new BadRequestException('Недопустимые URL изображений');
        }

        const field = isRenter ? 'renter_evidence' : 'owner_evidence';
        const current = isRenter ? dispute.renter_evidence : dispute.owner_evidence;

        return this.prisma.dispute.update({
            where: { id: disputeId },
            data: { [field]: [...current, ...dto.images].slice(0, 10) },
        });
    }

    async getMine(userId: string) {
        return this.prisma.dispute.findMany({
            where: {
                OR: [
                    { rentalRequest: { renter_id: userId } },
                    { rentalRequest: { listing: { owner_id: userId } } },
                ],
            },
            include: {
                rentalRequest: {
                    include: {
                        listing: { include: { images: true } },
                        renter: { select: { id: true, name: true, avatar_url: true } },
                    },
                },
                openedBy: { select: { id: true, name: true, avatar_url: true } },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async getOne(id: string, userId: string) {
        const dispute = await this.prisma.dispute.findUnique({
            where: { id },
            include: {
                rentalRequest: {
                    include: {
                        listing: { include: { images: true } },
                        renter: { select: { id: true, name: true, avatar_url: true, email: true } },
                    },
                },
                openedBy: { select: { id: true, name: true, avatar_url: true } },
            },
        });
        if (!dispute) throw new NotFoundException('Спор не найден');

        const isParticipant =
            dispute.rentalRequest.renter_id === userId ||
            dispute.rentalRequest.listing.owner_id === userId;
        if (!isParticipant) {
            throw new ForbiddenException('Нет доступа к этому спору');
        }
        return dispute;
    }

    // Admin endpoints

    async listAll(status?: DisputeStatus) {
        return this.prisma.dispute.findMany({
            where: status ? { status } : undefined,
            include: {
                rentalRequest: {
                    include: {
                        listing: { select: { id: true, title: true, deposit: true } },
                        renter: { select: { id: true, name: true, email: true } },
                    },
                },
                openedBy: { select: { id: true, name: true } },
            },
            orderBy: [{ status: 'asc' }, { created_at: 'desc' }],
        });
    }

    async resolve(id: string, dto: ResolveDisputeDto) {
        const dispute = await this.prisma.dispute.findUnique({
            where: { id },
            include: {
                rentalRequest: { include: { listing: true } },
            },
        });
        if (!dispute) throw new NotFoundException('Спор не найден');
        if (dispute.status !== 'OPEN') {
            throw new BadRequestException('Спор уже закрыт');
        }

        const rental = dispute.rentalRequest;
        const deposit = Number(rental.deposit);

        // Figure out how the deposit gets split based on the chosen outcome
        let depositToRenter: number;
        switch (dto.status) {
            case 'RESOLVED_FOR_RENTER':
                depositToRenter = deposit;
                break;
            case 'RESOLVED_FOR_OWNER':
            case 'REJECTED':
                depositToRenter = 0;
                break;
            case 'RESOLVED_SPLIT': {
                if (dto.deposit_to_renter == null) {
                    throw new BadRequestException(
                        'Для частичного решения нужно указать сумму возврата арендатору',
                    );
                }
                if (dto.deposit_to_renter < 0 || dto.deposit_to_renter > deposit) {
                    throw new BadRequestException(
                        `Сумма должна быть от 0 до ${deposit}`,
                    );
                }
                depositToRenter = dto.deposit_to_renter;
                break;
            }
            default:
                throw new BadRequestException('Неизвестный статус');
        }

        const depositToOwner = deposit - depositToRenter;
        const renterId = rental.renter_id;
        const ownerId = rental.listing.owner_id;
        const title = rental.listing.title;

        // Apply wallet adjustments + close dispute atomically
        await this.prisma.$transaction(async (tx) => {
            if (deposit > 0) {
                // Release the frozen deposit from owner's deposit_balance regardless
                await tx.user.update({
                    where: { id: ownerId },
                    data: { deposit_balance: { decrement: deposit } },
                });
                if (depositToRenter > 0) {
                    await tx.user.update({
                        where: { id: renterId },
                        data: { balance: { increment: depositToRenter } },
                    });
                    await tx.transaction.create({
                        data: {
                            user_id: renterId,
                            amount: depositToRenter,
                            type: 'REFUND',
                            description: `Возврат залога по спору: ${title}`,
                            rental_request_id: rental.id,
                        },
                    });
                }
                if (depositToOwner > 0) {
                    await tx.user.update({
                        where: { id: ownerId },
                        data: { balance: { increment: depositToOwner } },
                    });
                    await tx.transaction.create({
                        data: {
                            user_id: ownerId,
                            amount: depositToOwner,
                            type: 'INCOME',
                            description: `Компенсация по спору: ${title}`,
                            rental_request_id: rental.id,
                        },
                    });
                }
            }

            await tx.dispute.update({
                where: { id },
                data: {
                    status: dto.status,
                    admin_note: dto.admin_note,
                    deposit_to_renter: depositToRenter,
                    resolved_at: new Date(),
                },
            });

            // Move rental to COMPLETED so the system flow is consistent
            await tx.rentalRequest.update({
                where: { id: rental.id },
                data: { status: 'COMPLETED' },
            });
        });

        // Notify both parties
        this.notificationsGateway.sendToUser(renterId, 'dispute_resolved', {
            message: `Спор по аренде "${title}" разрешён. Возврат залога: ${depositToRenter} ₸`,
            disputeId: id,
        });
        this.notificationsGateway.sendToUser(ownerId, 'dispute_resolved', {
            message: `Спор по аренде "${title}" разрешён. Получено компенсации: ${depositToOwner} ₸`,
            disputeId: id,
        });

        return { ok: true, depositToRenter, depositToOwner };
    }
}
