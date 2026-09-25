import { Inject, Injectable } from '@nestjs/common';
import RemoveSellerCartItemsUseCase from '../../../../carts/domain/application/usecases/remove-seller-cart-items.usecase';
import RemoveSellerItemsCommand from '../../../../carts/domain/application/commands/remove-seller-items.command';
import CheckoutSessionNotFoundError from '../../errors/checkout-session-not-found.error';
import Order from '../../model/order.model';
import OrderPaymentMethod from '../../model/enums/order-payment-method.enum';
import OrderPaymentStatus from '../../model/enums/order-payment-status.enum';
import OrderStatus from '../../model/enums/order-status.enum';
import type CheckoutSessionRepositoryPort from '../../ports/checkout-session.repository.port';
import type OrderRepositoryPort from '../../ports/order.repository.port';
import {
  CHECKOUT_SESSION_REPOSITORY,
  ORDER_REPOSITORY,
} from '../../../shared/tokens/port.token';

@Injectable()
export default class MaterializeOrderFromCheckoutUseCase {
  constructor(
    @Inject(CHECKOUT_SESSION_REPOSITORY)
    private readonly sessions: CheckoutSessionRepositoryPort,
    @Inject(ORDER_REPOSITORY)
    private readonly orders: OrderRepositoryPort,
    private readonly removeSellerItems: RemoveSellerCartItemsUseCase,
  ) {}

  async execute(
    checkoutSessionId: number,
    userId: number,
    paymentMethod: OrderPaymentMethod,
  ): Promise<Order> {
    const existing =
      await this.orders.findByCheckoutSessionId(checkoutSessionId);
    if (existing) {
      return existing;
    }

    const session = await this.sessions.findByIdForUser(
      checkoutSessionId,
      userId,
    );
    if (!session) {
      throw new CheckoutSessionNotFoundError();
    }
    session.assertPayable();

    const orderNumber = await this.orders.nextOrderNumber();
    const priceTotal = session.getGoodsTotal();
    const discountTotal = 0;
    const priceAfterDiscount = priceTotal - discountTotal;
    const order = Order.create({
      orderNumber,
      userId: session.getUserId(),
      sellerId: session.getSellerId(),
      sellerShopName: session.getSellerShopName(),
      checkoutSessionId: session.getId(),
      status: OrderStatus.PAID,
      paymentStatus: OrderPaymentStatus.PAID,
      paymentMethod,
      address: session.getAddress(),
      shippingMethod: session.getShippingMethod(),
      shippingFee: session.getShippingFee(),
      deliveryDate: session.getDeliveryDate(),
      windowStartHour: session.getWindowStartHour(),
      windowEndHour: session.getWindowEndHour(),
      note: session.getNote(),
      goodsTotal: session.getGoodsTotal(),
      commissionTotal: session.getCommissionTotal(),
      prepaymentTotal: session.getPrepaymentTotal(),
      priceTotal,
      discountTotal,
      priceAfterDiscount,
      grandTotal: session.getPayableAmount(),
      items: Order.fromCheckoutLines(session.getLines()),
    });

    const saved = await this.orders.save(order);
    session.markPaid(saved.getId());
    await this.sessions.save(session);
    await this.removeSellerItems.execute(
      new RemoveSellerItemsCommand(userId, session.getSellerId()),
    );
    return saved;
  }
}
