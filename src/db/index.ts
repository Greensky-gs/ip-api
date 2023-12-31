import { Sequelize } from "sequelize";
import { readdirSync } from "node:fs";

export const sequelize = new Sequelize({
	dialect: "mysql",
	username: process.env.user,
	database: process.env.database,
	password: process.env.password,
	host: process.env.host,
	logging: false,
});

sequelize.sync({ alter: true });

readdirSync(`./dist/db/models`).forEach((fileName) => {
	require(`./models/${fileName}`);
});
