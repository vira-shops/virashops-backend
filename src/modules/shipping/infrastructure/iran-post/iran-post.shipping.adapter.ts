import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ShippingMethodName from '../../domain/model/enums/shipping-method.enum';
import ShippingMethodPort, {
  QuoteShippingInput,
  ShippingQuote,
} from '../../domain/ports/shipping-method.strategy.port';

@Injectable()
export default class IranPostShippingAdapter implements ShippingMethodPort {
  readonly name = ShippingMethodName.IRAN_POST;

  constructor(private readonly config: ConfigService) {}

  quote(input: QuoteShippingInput): Promise<ShippingQuote> {
    const threshold =
      this.config.get<number>('FREE_SHIPPING_THRESHOLD') ?? 20_000_000;
    const amount = input.subtotal >= threshold ? 0 : 75_000;
    const dates = nextWeekdayDates(7);
    return Promise.resolve({
      method: this.name,
      amount,
      earliestDate: dates[0],
      windows: [{ startHour: 9, endHour: 17 }],
      availableDates: dates,
    });
  }
}

function nextWeekdayDates(count: number): string[] {
  const dates: string[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (dates.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day === 5) {
      continue;
    }
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}
