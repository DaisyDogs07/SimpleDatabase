declare module 'SimpleDatabase' {
  import {EventEmitter} from 'events';
  export class DatabaseOptions {
    constructor(spaces?: number);
    public spaces?: number;
  }
  export class Database extends EventEmitter {
    constructor(location?: string, options?: DatabaseOptions);
    public add(path: string, amount?: number): this;
    public sub(path: string, amount?: number): this;
    public set(path: string, value: any): this;
    public set(path: '', value: object): this;
    public get(path?: string): object;
    public get(path: string): any;
    public delete(path: string): boolean;
    public has(path: string): boolean;
    public clear(): void;
    public read(): object;

    public on(event: 'change', listener: (path: string, oldData: object, newData: object) => void): this;
    public once(event: 'change', listener: (path: string, oldData: object, newData: object) => void): this;
    public emit(event: 'change', listener: (path: string, oldData: object, newData: object) => void): boolean;

    public toString(): string;
    public moveTo(location: string, deleteFile?: boolean): this;
    public clone(): this;
    public history: object[];
    public entries(): [string, any][];
    public toJSON(): object;
    public setSpaces(amount?: number): this;
    public static DatabaseOptions: typeof DatabaseOptions;
    public static default: typeof Database;
    public static Database: typeof Database;
  }
  export = Database;
}
