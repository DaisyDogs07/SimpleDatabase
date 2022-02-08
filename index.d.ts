declare module 'SimpleDatabase' {
  class Database {
    constructor(location?: string);

    public set(path: string, value: any): this;
    public delete(path: string): this;
    public clear(): void;

    public get(path?: string): any;
    public find(path: string, fn: (V: any, K: string) => void): any;
    public findAll(path: string, fn: (V: any, K: string) => void): any[];
    public has(path: string): boolean;
    public toString(): string;
    public read(): any;

    public clone(): Database;
  }
  export = Database;
}