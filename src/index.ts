import express from "express";
import { config } from "dotenv";
config();

import {
	writeFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	rmSync,
} from "node:fs";
import { v4 as uuid } from "uuid";
import requestIp from "request-ip";
import users from "./cache/users";
import {
	accessLevel,
	notNull,
	removeKey,
	sendFile,
	sendWebhook,
	wait,
} from "./utils/toolbox";
import allows from "./cache/allows";
import cors from "cors";
import { PermLevel } from "./types/core";
import { bulkUser, user } from "./types/user";
import bodyParser from "body-parser";

const logDir = (x?: string) => `./dist/logs${x ? `/${x}` : ""}`;
if (!existsSync(logDir())) mkdirSync(logDir());

const app = express();

app.use(
	cors({
		origin: `http://127.0.0.1:${process.env.port}`,
		optionsSuccessStatus: 200,
	}),
);
app.use(requestIp.mw());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/create-user", (req, res) => {
	const user = allows.getAllow(req.clientIp);
	if (!user || !user.allowed || !accessLevel("Root", user.userid))
		return sendFile(res, "unallowed");

	sendFile(res, "createUser");
});
app.all("/create", (req, res) => {
	const domain = "http://" + req.headers.host;
	const current = allows.getAllow(req.clientIp);
	if (!accessLevel("Root", current.userid))
		return res.redirect(`${domain}/unalowed`);

	const params = new URL(`${domain}${req.url}`).searchParams;
	const username = params.get("u");
	const password = params.get("p");
	let access = params.get("a") as keyof typeof PermLevel;

	if (!username || !password || !access)
		return res.redirect(
			new URL(
				`${domain}/create-user?m=Identifiant, permission ou mot de passe invalide`,
			).toString(),
		);
	if (!notNull(PermLevel[access])) {
		access = (access[0].toUpperCase() +
			access.slice(1)) as keyof typeof PermLevel;
		if (!notNull(PermLevel[access]))
			return res.redirect(
				new URL(
					`${domain}/create-user?m=Permission invalide. Réessayez avec Admin ou Visitor`,
				).toString(),
			);
	}
	const perm = PermLevel[access];
	const user = users.getUserByName(username);
	if (!!user)
		return res.redirect(
			new URL(
				`${domain}/create-user?m=Utilisateur déjà existant`,
			).toString(),
		);
	if (perm <= users.getUser(current.userid).perm)
		return res.redirect(
			new URL(
				`${domain}/create-user?m=Vous n'avez pas suffisament de permissions pour faire ça`,
			).toString(),
		);

	users.createUser({
		login: username,
		password: password,
		perm: perm,
	});

	return res.redirect(`${domain}/dashboard`);
});
app.get("/delete-user", (req, res) => {
	const user = allows.getAllow(req.clientIp);
	if (!user || !user.allowed || !accessLevel("Root", user.userid))
		return sendFile(res, "unallowed");

	sendFile(res, "deleteUser");
});
app.all("/delete", (req, res) => {
	const domain = "http://" + req.headers.host;
	const current = allows.getAllow(req.clientIp);
	if (!accessLevel("Root", current.userid))
		return res.redirect(`${domain}/unalowed`);

	const params = new URL(`${domain}${req.url}`).searchParams;
	const username = params.get("u");

	if (!username)
		return res.redirect(
			new URL(`${domain}/delete-user?m=Identifiant invalide`).toString(),
		);

	const user = users.getUserByName(username);
	if (!user)
		return res.redirect(
			new URL(
				`${domain}/delete-user?m=Utilisateur inexistant`,
			).toString(),
		);

	if (user.perm <= (users.getUser(current.userid)?.perm ?? PermLevel.Visitor))
		return res.redirect(
			new URL(
				`${domain}/delete-user?m=Vous n'avez pas suffisament de permissions pour faire ça`,
			).toString(),
		);

	users.deleteUser(user.id);

	return res.redirect(`${domain}/dashboard`);
});
app.get("/update-user", (req, res) => {
	const user = allows.getAllow(req.clientIp);
	if (!user || !user.allowed || !accessLevel("Root", user.userid))
		return sendFile(res, "unallowed");

	sendFile(res, "updateUser");
});
app.all("/update", (req, res) => {
	const domain = "http://" + req.headers.host;
	const current = allows.getAllow(req.clientIp);
	if (!accessLevel("Root", current.userid))
		return res.redirect(`${domain}/unalowed`);

	const params = new URL(`${domain}${req.url}`).searchParams;
	const username = params.get("u");
	let access = params.get("a") as keyof typeof PermLevel;

	if (!username || !access)
		return res.redirect(
			new URL(
				`${domain}/delete-user?m=Identifiant, permission ou mot de passe invalide`,
			).toString(),
		);

	if (!notNull(PermLevel[access])) {
		access = (access[0].toUpperCase() +
			access.slice(1)) as keyof typeof PermLevel;
		if (!notNull(PermLevel[access]))
			return res.redirect(
				new URL(
					`${domain}/create-user?m=Permission invalide. Réessayez avec Admin ou Visitor`,
				).toString(),
			);
	}
	const perm = PermLevel[access];

	const user = users.getUserByName(username);
	if (!user)
		return res.redirect(
			new URL(
				`${domain}/update-user?m=Utilisateur inexistant`,
			).toString(),
		);

	if (user.perm <= (users.getUser(current.userid)?.perm ?? PermLevel.Visitor))
		return res.redirect(
			new URL(
				`${domain}/update-user?m=Vous n'avez pas suffisament de permissions pour faire ça`,
			).toString(),
		);
	if (perm <= users.getUser(current.userid)?.perm ?? 2)
		return res.redirect(
			new URL(
				`${domain}/update-user?m=Vous n'avez pas suffisament de permissions pour faire ça`,
			).toString(),
		);

	users.updatePerm(user.id, perm);

	return res.redirect(`${domain}/dashboard`);
});
app.get("/img.png", (req, res) => {
	const domain = "http://" + req.headers.host;
	const params = new URL(`${domain}${req.url}`).searchParams;
	const marker = params.get("m");

	const uid = uuid();
	const id =
		Date.now()
			.toString()
			.slice(Math.floor(Date.now().toString().length / 2)) +
		"." +
		uid.slice(Math.floor(uid.length / 2));
	writeFileSync(
		logDir(`${id}.json`),
		JSON.stringify(
			{
				params: req.params,
				body: req.body,
				headers: req.headers,
				ip: req.ip,
				ips: req.ips,
				httpVersion: req.httpVersion,
				query: req.query,
				clientIp: req.clientIp,
				calculatedClientIp: requestIp.getClientIp(req),
				date: Date.now(),
				marker,
			},
			null,
			1,
		),
	);

	res.sendFile("./img.png", {
		root: process.cwd() + "/assets",
	});

	sendWebhook(`Nouvelle requête enregistrée`);
});
app.get("/login", (req, res) => {
	sendFile(res, "login");
});
app.all("/enter", async(req, res) => {
	const domain = "http://" + req.headers.host;
	const params = new URL(`${domain}${req.url}`).searchParams;
	const username = params.get("u");
	const password = params.get("p");

	const user = users.getUserByName(username);
	if (!user || !users.match(user?.id, password)) {
		await wait(1000)
		return res.redirect(
			new URL(
				`${domain}/login?m=Identifiant ou mot de passe invalide`,
			).toString(),
		);
	}
	allows.allow(req.clientIp, user.id);

	return res.redirect(`${domain}/dashboard`);
});
app.get("/dashboard", (req, res) => {
	const user = allows.getAllow(req.clientIp);
	if (!user || !user.allowed) return sendFile(res, "unallowed");

	if (accessLevel("Root", user.userid)) return sendFile(res, "rootDashboard");
	if (accessLevel("Admin", user.userid))
		return sendFile(res, "adminDashboard");
	sendFile(res, "visitorDashboard");
});
app.get("/logs", (req, res) => {
	const user = allows.getAllow(req.clientIp);
	if (!user || !user.allowed)
		return res.send({
			ok: false,
		});

	const logs = readdirSync("./dist/logs").map((name) => ({
		...require(`./logs/${name}`),
		id: name.replace(".json", ""),
	}));
	return res.send(logs);
});
app.get("/unallowed", (_, res) => {
	sendFile(res, "unallowed");
});
app.all("/delete-log", (req, res) => {
	const user = allows.getAllow(req.clientIp);
	const domain = "http://" + req.headers.host;
	const id = new URL(`${domain}${req.url}`).searchParams.get("id");

	if (!user || !user.allowed) return res.redirect(domain + "/unallowed");
	if (!accessLevel("Admin", user.userid))
		return res.redirect(domain + "/unallowed");

	const path = `dist/logs/${id}.json`;
	if (existsSync(path)) rmSync(path);

	return res.redirect(domain + "/dashboard");
});
app.get("/users", (req, res) => {
	const connection = allows.getAllow(req.clientIp);
	if (!connection || !connection.allowed) return res.send([false]);
	const user = users.getUser(connection.userid);
	if (!accessLevel("Admin", user.id)) return res.send([false]);

	const mapper = accessLevel("Root", user.id)
		? (u: user) => u
		: (u: user) => removeKey(u, "password");
	const map = users.users.map((u) => ({
		...mapper(u),
		access: PermLevel[u.perm],
	}));

	return res.send(map);
});
app.get("/users-list", (req, res) => {
	sendFile(res, "usersList");
});
app.get("/log", (req, res) => {
	const user = allows.getAllow(req.clientIp);
	if (!user || !user.allowed) return sendFile(res, "unallowed");
	const domain = "http://" + req.headers.host;
	const id = new URL(`${domain}${req.url}`).searchParams.get("id");

	const logs = readdirSync("./dist/logs").map((name) => ({
		...require(`./logs/${name}`),
		id: name.replace(".json", ""),
	}));

	const log = logs.find((x) => x.id === id);
	return res.send(!!log ? log : {});
});
app.post("/change-credits", (req, res) => {
	const user = allows.getAllow(req.clientIp);
	if (!user || !user.allowed) return res.send("/unallowed");

	const options: bulkUser = {
		id: user.userid,
	};
	if (req.body.username) options.login = req.body.username;
	if (req.body.password) options.password = req.body.password;

	if (options.login && !!users.getUserByName(options.login))
		return res.send(
			new URL(
				`http://${req.headers.host}/credits?m=Ce nom d'utilisateur est déjà utilisé`,
			).toString(),
		);

	if (Object.keys(options).length === 1)
		return res.send(
			new URL(
				`http://${req.headers.host}/credits?m=Identifiant ou mot de passe invalide`,
			).toString(),
		);

	users.bulkUpdate(options);

	const url = new URL(`http://${req.headers.host}/login`);
	url.searchParams.set(
		"m",
		"Vos identifiants ont été mis à jour\nVeuillez vous reconnecter",
	);

	allows.disallow(req.clientIp);

	res.send(url.toString());
});
app.get("/credits", (req, res) => {
	const user = allows.getAllow(req.clientIp);
	if (!user || !user.allowed) return sendFile(res, "unallowed");

	sendFile(res, "updateCredits");
});

app.listen(process.env.port);

console.log(`API started on port ${process.env.port}`);
