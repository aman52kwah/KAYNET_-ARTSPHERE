import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from '../db/db.js';
async function defineUser(){

 const sequelize = await sequelizePromise;

if(!sequelize){
    throw new Error("sequelize Sequelize instance is undefined. Check db.js configuration.")
}
const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: { isEmail: true },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password:{
        type:DataTypes.STRING,
        allowNull:true,
    },
    authSource: {
      type: DataTypes.ENUM("google"),
    },
    googleId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("customer", "Admin"),
      defaultValue: "customer",
    },
    phone: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.TEXT,
    },
    city:{
        type:DataTypes.TEXT,
    },
    country:{
        type:DataTypes.TEXT,
    }
  },
  { tablename: "Users", timestamps: false }
);
    return User;
}

const UserPromise = defineUser().catch((error)=>{
    console.error('Failed to define User model:',error);
    throw error;
});

export{UserPromise as User};