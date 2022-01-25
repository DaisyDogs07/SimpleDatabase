declare module 'SimpleDatabase' {
  import {EventEmitter} from 'events';

  class Database extends EventEmitter {
    constructor(location?: string);

    public add(path: string, amount?: number): this;
    public sub(path: string, amount?: number): this;
    public set(path: string, value: any): this;
    public set(path: '', value: object | any[]): this;
    public delete(path: string): this;
    public clear(): void;

    public find(path: string, fn: (V: any, K: string) => void): any;
    public findAll(path: string, fn: (V: any, K: string) => void): any[];
    public has(path: string): boolean;
    public get(path?: ''): object | any[];
    public get(path: string): any;
    public toString(): string;
    public read(): object | any[];

    public on(event: string | symbol, listener: (...args: any[]) => void): this;
    public on(event: 'change', listener: (path: string, oldData: object | any[], newData: object | any[]) => void): this;
    public addListener(event: string | symbol, listener: (...args: any[]) => void): this;
    public addListener(event: 'change', listener: (path: string, oldData: object | any[], newData: object | any[]) => void): this;

    public off(event: string | symbol, listener: (...args: any[]) => void): this;
    public off(event: 'change', listener: (path: string, oldData: object | any[], newData: object | any[]) => void): this;
    public removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
    public removeListener(event: 'change', listener: (path: string, oldData: object | any[], newData: object | any[]) => void): this;

    public once(event: string | symbol, listener: (...args: any[]) => void): this;
    public once(event: 'change', listener: (path: string, oldData: object | any[], newData: object | any[]) => void): this;

    public emit(event: string | symbol, listener: (...args: any[]) => void): boolean;
    public emit(event: 'change', listener: (path: string, oldData: object | any[], newData: object | any[]) => void): boolean;

    public clone(): Database;
  }
  export = Database;
}