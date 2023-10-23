import { PermLevel } from "./core";

export type user = {
	login: string;
	password: string;
	id: string;
	perm: PermLevel;
};
export type bulkUser = {
	[K in keyof user]?: user[K];
};
