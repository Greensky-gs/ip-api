import { user } from "../types/user";
import { v4 as uuid } from "uuid";
import db from "../db/models/users";
import { createHash } from "crypto";
import { PermLevel } from "../types/core";

export class UsersManager {
	private cache: Record<string, user> = {};

	constructor() {
		this.start();
	}

	public createUser({
		login,
		password,
		perm
	}: {
		login: string;
		password: string;
		perm: PermLevel | keyof typeof PermLevel
	}) {
		if (this.users.find((x) => x.login === login))
			return "username already taken";
		const id = uuid();

		const permission = typeof perm === 'number' ? perm : PermLevel[perm]

		const hashed = this.hash(password);
		this.cache[id] = {
			id,
			login,
			password: hashed,
			perm: permission
		};

		db.create({
			login,
			password: hashed,
			id,
			perm: permission
		}).catch((err) => console.log(err));
	}
	public getUser(id: string) {
		return this.cache[id];
	}
	public get users() {
		return Object.keys(this.cache).map((k) => this.cache[k]);
	}
	public match(userId: string, input: string) {
		const password = this.getUser(userId)?.password;
		if (!password) return false;

		return this.hash(input) === password;
	}
	public getUserByName(name: string) {
		return this.users.find(x => x.login === name)
	}

	private hash(str: string) {
		const hash = createHash("sha256");
		hash.update(str);

		const hashed = hash.digest("hex");

		return hashed;
	}
	private async start() {
		const users = await db.findAll().catch(console.log);
		if (!users) return;

		for (const user of users) {
			this.cache[user.dataValues.id] = user.dataValues;
		}
	}
}
