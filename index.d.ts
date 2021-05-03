declare module 'SimpleDatabase' {
  import { EventEmitter } from 'events';
  export class DatabaseOptions {
    constructor(spaces?: number);
    public spaces?: number;
  }
  export class Database {
    constructor(location?: string, options?: DatabaseOptions);
    private spaces?: number;
    private FilePath?: string;
    public toJSON(): string;
    public add(path: string, amount?: number): this;
    public sub(path: string, amount?: number): this;
    public set(path: string, value: any): this;
    public get(path: string): any;
    public delete(path: string): boolean;
    private read(): object;
    private static DatabaseOptions: DatabaseOptions;

    public on(event: 'change', listener: (path: string, oldData: object, newData: object) => void): this;
    public once(event: 'change', listener: (path: string, oldData: object, newData: object) => void): this;
    public emit(event: 'change', listener: (path: string, oldData: object, newData: object) => void): this;
  }
}
