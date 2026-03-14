import { Injectable, Logger, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService extends Logger {
  private requestId?: string;

  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  log(message: string, ...optionalParams: unknown[]): void {
    super.log(this.formatMessage(message), ...optionalParams);
  }

  error(message: string, trace?: string, ...optionalParams: unknown[]): void {
    super.error(this.formatMessage(message), trace, ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    super.warn(this.formatMessage(message), ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    super.debug(this.formatMessage(message), ...optionalParams);
  }

  private formatMessage(message: string): string {
    return this.requestId ? `[${this.requestId}] ${message}` : message;
  }
}
