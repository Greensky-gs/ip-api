import { PermLevel } from "./core";

export type user = {
	login: string;
	password: string;
	id: string;
	perm: PermLevel;
};
