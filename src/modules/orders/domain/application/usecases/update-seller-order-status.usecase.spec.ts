import OrderStatus from '../../model/enums/order-status.enum';
import Order from '../../model/order.model';
import UpdateSellerOrderStatusCommand from '../commands/update-seller-order-status.command';
import UpdateSellerOrderStatusUseCase from './update-seller-order-status.usecase';
import InvalidOrderStatusTransitionError from '../../errors/invalid-order-status-transition.error';
import OrderPaymentMethod from '../../model/enums/order-payment-method.enum';
import OrderPaymentStatus from '../../model/enums/order-payment-status.enum';
import ShippingMethodName from '../../../../shipping/domain/model/enums/shipping-method.enum';

describe('UpdateSellerOrderStatusUseCase', () => {
  const baseOrder = () =>
    Order.restore({
      id: 1,
      orderNumber: 'VR-1',
      userId: 2,
      sellerId: 10,
      sellerShopName: 'Shop',
      checkoutSessionId: 3,
      status: OrderStatus.PAID,
      paymentStatus: OrderPaymentStatus.PAID,
      paymentMethod: OrderPaymentMethod.ONLINE,
      address: {
        id: 1,
        label: 'a',
        line1: 'l',
        line2: null,
        city: 'c',
        province: 'p',
        postalCode: '1234567890',
        recipientFullName: 'n',
        recipientPhone: '09120000000',
        nationalId: '0012345678',
        houseNumber: '1',
      },
      shippingMethod: ShippingMethodName.EXPRESS_COURIER,
      shippingFee: 0,
      deliveryDate: '2026-01-01',
      windowStartHour: 9,
      windowEndHour: 12,
      note: null,
      goodsTotal: 100,
      commissionTotal: 5,
      prepaymentTotal: 105,
      priceTotal: 100,
      discountTotal: 0,
      priceAfterDiscount: 100,
      grandTotal: 105,
      items: [],
      createdAt: new Date(),
    });

  const orders = {
    findByIdForSeller: jest.fn(),
    save: jest.fn((order: Order) => order),
  };

  const useCase = new UpdateSellerOrderStatusUseCase(orders as never);

  beforeEach(() => jest.clearAllMocks());

  it('moves PAID to PREPARING', async () => {
    orders.findByIdForSeller.mockResolvedValue(baseOrder());
    const result = await useCase.execute(
      new UpdateSellerOrderStatusCommand(10, 1, OrderStatus.PREPARING),
    );
    expect(result.getStatus()).toBe(OrderStatus.PREPARING);
    expect(orders.save).toHaveBeenCalled();
  });

  it('moves SHIPPED to RETURNED', async () => {
    const shipped = baseOrder();
    shipped.transitionTo(OrderStatus.PREPARING);
    shipped.transitionTo(OrderStatus.SHIPPED);
    orders.findByIdForSeller.mockResolvedValue(shipped);
    const result = await useCase.execute(
      new UpdateSellerOrderStatusCommand(10, 1, OrderStatus.RETURNED),
    );
    expect(result.getStatus()).toBe(OrderStatus.RETURNED);
  });

  it('rejects invalid transition', async () => {
    orders.findByIdForSeller.mockResolvedValue(baseOrder());
    await expect(
      useCase.execute(
        new UpdateSellerOrderStatusCommand(10, 1, OrderStatus.DELIVERED),
      ),
    ).rejects.toBeInstanceOf(InvalidOrderStatusTransitionError);
  });
});
