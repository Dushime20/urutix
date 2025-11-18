export interface EmailProvider {
  getName(): string;
  send(payload: any): Promise<any>;
}
