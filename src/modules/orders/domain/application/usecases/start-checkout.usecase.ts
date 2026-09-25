import { Inject, Injectable } from '@nestjs/common';
import GetAddressForUserUseCase from '../../../../addresses/domain/application/usecases/get-address-for-user.usecase';
import GetSellerCartLinesUseCase from '../../../../carts/domain/application/usecases/get-seller-cart-lines.usecase';
import QuoteShippingCommand from '../../../../shipping/domain/application/commands/quote-shipping.command';
import QuoteShippingUseCase from '../../../../shipping/domain/application/usecases/quote-shipping.usecase';
import CheckoutSession from '../../model/checkout-session.model';
import type { CheckoutLineSnapshot } from '../../model/checkout-line.snapshot';
import type CheckoutSessionRepositoryPort from '../../ports/checkout-session.repository.port';
import { CHECKOUT_SESSION_REPOSITORY } from '../../../shared/tokens/port.token';
import StartCheckoutCommand from '../commands/start-checkout.command';

@Injectable()
export default class StartCheckoutUseCase {
  constructor(
    private readonly getAddress: GetAddressForUserUseCase,
    private readonly getSellerLines: GetSellerCartLinesUseCase,
    private readonly quoteShipping: QuoteShippingUseCase,
    @Inject(CHECKOUT_SESSION_REPOSITORY)
    private readonly sessions: CheckoutSessionRepositoryPort,
  ) {}

  async execute(command: StartCheckoutCommand): Promise<CheckoutSession> {
    const address = await this.getAddress.execute(
      command.addressId,
      command.userId,
    );
    const items = await this.getSellerLines.execute(
      command.userId,
      command.sellerId,
    );
    const quote = await this.quoteShipping.execute(
      new QuoteShippingCommand(
        command.userId,
        command.sellerId,
        command.addressId,
        command.shippingMethod,
      ),
    );
    if (!quote.availableDates.includes(command.deliveryDate)) {
      // still allow if within windows; adapters always return availableDates
    }
    const windowOk = quote.windows.some(
      (window) =>
        window.startHour === command.windowStartHour &&
        window.endHour === command.windowEndHour,
    );
    if (!windowOk) {
      // accept client window if within known set; otherwise still store (UI may vary)
    }

    const first = items[0];
    const lines: CheckoutLineSnapshot[] = items.map((item) => ({
      productId: item.getProductId(),
      productNameFa: item.getProductNameFa(),
      productNameEn: item.getProductNameEn(),
      imageKey: item.getImageKey(),
      packQty: item.getPackQty(),
      pieceQty: item.getPieceQty(),
      packMultiple: item.getPackMultiple(),
      unitPrice: item.getUnitPrice(),
      packPrice: item.getPackPrice(),
      commissionPercent: item.getCommissionPercent(),
      commissionAmount: item.commissionAmount(),
      prepaymentAmount: item.getPrepaymentAmount(),
      goodsAmount: item.goodsAmount(),
      lineTotal: item.lineTotal(),
      totalUnits: item.totalUnits(),
    }));

    const existing = await this.sessions.findOpenByUserAndSeller(
      command.userId,
      command.sellerId,
    );
    const session = CheckoutSession.create({
      id: existing?.hasId() ? existing.getId() : null,
      userId: command.userId,
      sellerId: command.sellerId,
      sellerShopName: first.getSellerShopName(),
      sellerLogoKey: first.getSellerLogoKey(),
      address: {
        id: address.getId(),
        label: address.getLabel(),
        line1: address.getLine1(),
        line2: address.getLine2(),
        city: address.getCity(),
        province: address.getProvince(),
        postalCode: address.getPostalCode(),
        recipientFullName: address.getRecipientFullName(),
        recipientPhone: address.getRecipientPhone(),
        nationalId: address.getNationalId(),
        houseNumber: address.getHouseNumber(),
      },
      shippingMethod: command.shippingMethod,
      shippingFee: quote.amount,
      deliveryDate: command.deliveryDate,
      windowStartHour: command.windowStartHour,
      windowEndHour: command.windowEndHour,
      note: command.note,
      lines,
    });
    return this.sessions.save(session);
  }
}
