import express from "express";
import { config } from "dotenv";
config();

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { v4 as uuid } from "uuid";
import requestIp from "request-ip";
import users from "./cache/users";
import { accessLevel, sendFile, sendWebhook } from "./utils/toolbox";
import allows from "./cache/allows";
import cors from 'cors';

const logDir = (x?: string) => `./dist/logs${x ? `/${x}` : ""}`;
if (!existsSync(logDir())) mkdirSync(logDir());

const app = express();

app.use(cors({
    origin: `http://127.0.0.1:${process.env.port}`,
    optionsSuccessStatus: 200
}))
app.use(requestIp.mw());
app.use(express.static("public"));

app.get("/img.png", (req, res) => {
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
			},
			null,
			1
		)
	);

	res.sendFile("./img.png", {
		root: process.cwd() + "/assets",
	});

	sendWebhook(`Nouvelle requête enregistrée`);
});
app.get("/login", (req, res) => {
	sendFile(res, "login");
});
app.all("/enter", (req, res) => {
	const domain = 'http://' + req.headers.host
	const params = new URL(`${domain}${req.url}`).searchParams;
	const username = params.get('u');
	const password = params.get('p');

	const user = users.getUserByName(username);
	if (!user || !users.match(user?.id, password))
		return res.redirect(
			new URL(
				`${domain}/login?m=Identifiant ou mot de passe invalide`
			).toString()
		);
	allows.allow(req.clientIp, user.id);

	return res.redirect(`${domain}/dashboard`);
});
app.get('/dashboard', (req, res) => {
	const user = allows.getAllow(req.clientIp)
	if (!user) return sendFile(res, 'unallowed')
})

app.listen(process.env.port);

console.log(`API started on port ${process.env.port}`);
