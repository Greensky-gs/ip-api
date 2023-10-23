import axios from "axios";
import { Response } from "express";
import { PermLevel } from "../types/core";
import users from "../cache/users";

export const sendWebhook = (content: string) => {
	if (!process.env.webhook) return;

	axios
		.post(
			process.env.webhook,
			{
				content: content,
			},
			{
				headers: {
					"Content-Type": "application/json",
				},
			},
		)
		.catch(console.log);
};
export const sendFile = (res: Response, htmlName: string) => {
	res.sendFile(`./contents/${htmlName}.html`, {
		root: process.cwd() + "/dist",
	});
};
export const accessLevel = (perm: keyof typeof PermLevel, userId: string) => {
	const user = users.getUser(userId);
	return (user?.perm ?? PermLevel.Visitor) <= PermLevel[perm];
};
export const notNull = (x: any) => ![undefined, null, ""].includes(x);
export const removeKey = <T, K extends keyof T>(obj: T, key: K): Omit<T, K> => {
	const { [key]: _, ...rest } = obj;
	return rest;
};
export const wait = (ms: number): Promise<true> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(true);
		}, ms);
	});
};
