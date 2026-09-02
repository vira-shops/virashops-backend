export default interface SmsServicePort {
  send(phone: string, message: string): Promise<void>;
}
