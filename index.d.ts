declare module 'SimpleDatabase' {
  import {EventEmitter} from 'events';

  interface DatabaseOptions {
    spaces?: number;
  }

  class Database extends EventEmitter {
    constructor(location?: string, options?: DatabaseOptions);

    public add(path: string, amount?: number): this;
    public sub(path: string, amount?: number): this;
    public set(path: string, value: any): this;
    public set(path: '', value: object): this;
    public delete(path: string): boolean;
    public clear(): void;
    public moveTo(location: string, deleteFile?: boolean): this;
    public setSpaces(amount?: number): this;

    public find(path: string, fn: (V: any, K: string) => boolean): any;
    public findAll(path: string, fn: (V: any, K: string) => boolean): any[];
    public has(path: string): boolean;
    public get(path: string): any;
    public get(path?: ''): object;
    public entries(): [string, any][];
    public toString(): string;
    public history: object[];
    private read(): object;
    private filePath: string;
    private spaces: number;

    public on(event: 'change', listener: (path: string, oldData: object, newData: object) => void): this;
    public off(event: 'change', listener: (path: string, oldData: object, newData: object) => void): this;
    public once(event: 'change', listener: (path: string, oldData: object, newData: object) => void): this;
    public emit(event: 'change', listener: (path: string, oldData: object, newData: object) => void): boolean;

    public clone(): this;

    public static Database: typeof Database;
    public static default: typeof Database;
  }
  export = Database;
}