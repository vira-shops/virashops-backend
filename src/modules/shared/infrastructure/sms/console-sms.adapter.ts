import { Injectable, Logger } from '@nestjs/common';
import SmsServicePort from '../../application/ports/sms.service.port';

@Injectable()
export default class ConsoleSmsAdapter implements SmsServicePort {
  private readonly logger = new Logger(ConsoleSmsAdapter.name);

  async send(phone: string, message: string): Promise<void> {
    this.logger.log(`SMS to ${phone}: ${message}`);
  }
}
