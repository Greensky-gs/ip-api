import { Op } from "sequelize";
import allow from "../db/models/allow";
import { allowed } from "../types/allowing";

export class Allow {
	private cache: Record<string, allowed<false>> = {};

	constructor() {
		this.start();
	}

	public getAllow(ip: string) {
		return this.cache[ip];
	}
	public allowed(ip: string) {
		return this.getAllow(ip)?.allowed;
	}
	public allow(ip: string, userid: string) {
		const allowDate = Date.now();
		this.cache[ip] = {
			ip: ip,
			allowed: true,
			allowedAt: allowDate,
			userid: userid,
		};

		allow
			.findOrCreate({
				where: { ip: ip },
				defaults: {
					ip: ip,
					allowed: true,
					allowedAt: allowDate,
					userid: userid,
				},
			})
			.then(([m, u]) => {
				if (!u)
					m.update({
						allowed: true,
						allowedAt: allowDate,
						userid: userid,
					}).catch(console.log);
			});
	}
	public disallow(ip: string) {
		if (this.cache[ip]) delete this.cache[ip];

		allow
			.destroy({
				where: {
					ip: ip,
				},
			})
			.catch(console.log);
	}

	private clean() {
		const now = Date.now();
		const valids = Object.keys(this.cache)
			.filter((k) => now - this.cache[k].allowedAt >= 86400000)
			.map((k) => [k, this.cache[k]]);

		this.cache = Object.fromEntries(valids);

		allow
			.destroy({
				where: {
					ip: {
						[Op.in]: valids.map((x) => x[0]),
					},
				},
			})
			.catch(console.log);
	}
	private timeout() {
		const currentDay = Date.now();
		const todayMidnight = new Date(currentDay);
		todayMidnight.setHours(0, 0, 0, 0);
		const tomorrowMidnight = new Date(todayMidnight).getTime() + 86400000;

		const diff = tomorrowMidnight - currentDay;

		setTimeout(() => {
			this.clean();
			this.timeout();
		}, diff);
	}
	private async start() {
		const datas = await allow.findAll().catch(console.log);
		if (!datas) return;

		for (const data of datas) {
			this.cache[data.dataValues.ip] = {
				...data.dataValues,
				allowedAt: parseInt(data.dataValues.allowedAt),
			};
		}

		this.timeout();
	}
}
