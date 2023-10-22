import { DataTypes } from "sequelize";
import { sequelize } from "..";
import { PermLevel } from "../../types/core";

const users = sequelize.define('users', {
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    login: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    perm: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: PermLevel.Visitor
    }
})

users.sync()

export default users