import ShippingMethodName from '../model/enums/shipping-method.enum';

export type QuoteShippingInput = {
  sellerId: number;
  addressId: number;
  items: Array<{ productId: number; quantity: number; unitPrice: number }>;
  subtotal: number;
};

export type ShippingQuote = {
  method: ShippingMethodName;
  amount: number;
  earliestDate: string;
  windows: Array<{ startHour: number; endHour: number }>;
  availableDates: string[];
};

export default interface ShippingMethodPort {
  readonly name: ShippingMethodName;
  quote(input: QuoteShippingInput): Promise<ShippingQuote>;
}
