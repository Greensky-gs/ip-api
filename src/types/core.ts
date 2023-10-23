export type If<
	C extends boolean,
	A extends any,
	B extends any = any,
> = C extends true ? A : C extends false ? B : never;
export enum PermLevel {
	Root = 0,
	Admin = 1,
	Visitor = 2,
}
