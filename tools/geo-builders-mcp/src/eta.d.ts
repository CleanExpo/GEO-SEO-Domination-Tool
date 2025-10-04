declare module 'eta' {
  export class Eta {
    constructor(config?: any);
    renderString(template: string, data: any): string;
  }
}
