export interface PushProvider {
  getName(): string;
  send(payload: any): Promise<any>;
}
