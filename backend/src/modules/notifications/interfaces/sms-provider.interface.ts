export interface SmsProvider {
  getName(): string;
  send(payload: any): Promise<any>;
}
