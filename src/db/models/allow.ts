import { DataTypes } from "sequelize";
import { sequelize } from "..";

const allow = sequelize.define('allow', {
    ip: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    allowed: {
        type: DataTypes.BOOLEAN,
        primaryKey: false,
        allowNull: false,
        defaultValue: false
    },
    allowedAt: {
        type: DataTypes.STRING,
        primaryKey: false,
        allowNull: false
    },
    userid: {
        type: DataTypes.STRING,
        primaryKey: false,
        allowNull: false
    }
})

allow.sync()

export default allow