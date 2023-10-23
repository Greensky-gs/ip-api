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

	public changePassword(userId: string, password: string) {
		if (!this.getUser(userId)) return false

		const hash = this.hash(password)
		this.cache[userId].password = hash

		db.update({
			password: hash
		}, {
			where: {
				id: userId
			}
		}).catch(console.log)
		return true
	}
	public updateUsername(userId: string, name: string) {
		if (!this.getUser(userId)) return false
		if (this.getUserByName(name)) return false

		this.cache[userId].login = name

		db.update({
			login: name
		}, {
			where: {
				id: userId
			}
		}).catch(console.log)
		return true
	}
	public createUser({
		login,
		password,
		perm,
	}: {
		login: string;
		password: string;
		perm: PermLevel | keyof typeof PermLevel;
	}) {
		if (this.users.find((x) => x.login === login))
			return "username already taken";
		const id = uuid();

		const permission = typeof perm === "number" ? perm : PermLevel[perm];

		const hashed = this.hash(password);
		this.cache[id] = {
			id,
			login,
			password: hashed,
			perm: permission,
		};

		db.create({
			login,
			password: hashed,
			id,
			perm: permission,
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
		return this.users.find((x) => x.login === name);
	}
	public deleteUser(userId: string) {
		const has = !!this.cache[userId];
		if (has) delete this.cache[userId];

		db.destroy({
			where: {
				id: userId,
			},
		}).catch(console.log);
		return has;
	}
	public updatePerm(userId: string, access: PermLevel) {
		const has = !!this.cache[userId];
		if (has) this.cache[userId].perm = access;

		db.update(
			{
				perm: access,
			},
			{
				where: {
					id: userId,
				},
			},
		);
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
