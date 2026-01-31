// models/Cart.js
import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from "../db/db.js";

async function defineCart() {
  const sequelize = await sequelizePromise;

  if (!sequelize) {
    throw new Error("Sequelize instance is undefined. Check db.js configuration.");
  }

  const Cart = sequelize.define(
    "Cart",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true, // Each user can only have one cart
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE", // Delete cart when user is deleted
        onUpdate: "CASCADE",
      },
      status: {
        type: DataTypes.ENUM("active", "abandoned", "converted"),
        defaultValue: "active",
        allowNull: false,
      },
      sessionId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "For guest carts (before login)",
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "When the cart should be considered abandoned",
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        allowNull: true,
      },
    },
    {
      tableName: "Carts",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["userId"],
        },
        {
          fields: ["sessionId"],
        },
        {
          fields: ["status"],
        },
      ],
    }
  );

  return Cart;
}

const CartPromise = defineCart().catch((error) => {
  console.error("Failed to define Cart model:", error);
  throw error;
});

export { CartPromise as Cart };