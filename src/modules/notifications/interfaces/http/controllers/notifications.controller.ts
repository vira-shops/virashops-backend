import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import ApiResponse from '../../../../../common/http/api-response';
import Role from '../../../../users/domain/model/enums/role.enum';
import User from '../../../../users/domain/model/user.model';
import CurrentUser from '../../../../users/interfaces/http/decorators/current-user.decorator';
import Roles from '../../../../users/interfaces/http/decorators/roles.decorator';
import JwtAuthGuard from '../../../../users/interfaces/http/guards/jwt-auth.guard';
import RolesGuard from '../../../../users/interfaces/http/guards/roles.guard';
import ListNotificationsQuery from '../../../domain/application/queries/list-notifications.query';
import CountUnreadNotificationsUseCase from '../../../domain/application/usecases/count-unread-notifications.usecase';
import GetNotificationUseCase from '../../../domain/application/usecases/get-notification.usecase';
import ListNotificationsUseCase from '../../../domain/application/usecases/list-notifications.usecase';
import MarkAllNotificationsReadUseCase from '../../../domain/application/usecases/mark-all-notifications-read.usecase';
import MarkNotificationReadUseCase from '../../../domain/application/usecases/mark-notification-read.usecase';
import NotificationHttpMapper from '../mappers/notification-http.mapper';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.RETAIL_BUYER,
  Role.WHOLESALE_BUYER,
  Role.WHOLESALE_SELLER,
  Role.RETAIL_SELLER,
)
@Controller('notifications')
export default class NotificationsController {
  constructor(
    private readonly listNotifications: ListNotificationsUseCase,
    private readonly countUnread: CountUnreadNotificationsUseCase,
    private readonly getNotification: GetNotificationUseCase,
    private readonly markRead: MarkNotificationReadUseCase,
    private readonly markAllRead: MarkAllNotificationsReadUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List my in-app notifications' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async list(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 20;
    const result = await this.listNotifications.execute(
      new ListNotificationsQuery(user.getId(), pageNum, limitNum),
    );
    return ApiResponse.of({
      items: result.items.map((item) =>
        NotificationHttpMapper.toResponse(item),
      ),
      total: result.total,
      page: pageNum,
      limit: limitNum,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread notification count' })
  async unreadCount(@CurrentUser() user: User) {
    const count = await this.countUnread.execute(user.getId());
    return ApiResponse.of({ count });
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async readAll(@CurrentUser() user: User) {
    const result = await this.markAllRead.execute(user.getId());
    return ApiResponse.of(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Notification detail' })
  async get(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    const notification = await this.getNotification.execute(id, user.getId());
    return ApiResponse.of(NotificationHttpMapper.toResponse(notification));
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async read(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    const notification = await this.markRead.execute(id, user.getId());
    return ApiResponse.of(NotificationHttpMapper.toResponse(notification));
  }
}
