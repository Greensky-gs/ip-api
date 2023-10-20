import { DataTypes } from "sequelize";
import { sequelize } from "..";

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
    }
})

users.sync()

export default users