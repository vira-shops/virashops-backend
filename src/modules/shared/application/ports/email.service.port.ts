export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export default interface EmailServicePort {
  send(params: SendEmailParams): Promise<void>;
}
