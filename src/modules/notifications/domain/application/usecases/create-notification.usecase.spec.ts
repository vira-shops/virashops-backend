import CreateNotificationCommand from '../commands/create-notification.command';
import NotificationPriority from '../../model/enums/notification-priority.enum';
import NotificationType from '../../model/enums/notification-type.enum';
import Notification from '../../model/notification.model';
import CreateNotificationUseCase from './create-notification.usecase';

describe('CreateNotificationUseCase', () => {
  const notifications = {
    save: jest.fn((n: Notification) =>
      Notification.restore({ ...n.toSnapshot(), id: 1, createdAt: new Date() }),
    ),
  };

  const useCase = new CreateNotificationUseCase(notifications as never);

  it('creates an in-app notification', async () => {
    const result = await useCase.execute(
      new CreateNotificationCommand(
        10,
        NotificationType.ORDER,
        'Title',
        'Message',
        NotificationPriority.NORMAL,
        'ORDER',
        '55',
      ),
    );
    expect(result.getId()).toBe(1);
    expect(result.getRecipientUserId()).toBe(10);
    expect(notifications.save).toHaveBeenCalled();
  });
});
