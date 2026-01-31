// models/CartItems.js
import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from "../db/db.js";

async function defineCartItems() {
  const sequelize = await sequelizePromise;

  if (!sequelize) {
    throw new Error("Sequelize instance is undefined. Check db.js configuration.");
  }

  const CartItems = sequelize.define(
    "CartItems",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      cartId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Carts",
          key: "id",
        },
        onDelete: "CASCADE", // Delete cart items when cart is deleted
        onUpdate: "CASCADE",
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Products",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: {
            args: [1],
            msg: "Quantity must be at least 1",
          },
        },
      },
      size: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Selected size (XS, S, M, L, XL, XXL)",
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Selected color",
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: "Price at the time of adding to cart",
      },
      customization: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: "Any customization options",
      },
      addedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    },
    {
      tableName: "CartItems",
      timestamps: true,
      indexes: [
        {
          fields: ["cartId"],
        },
        {
          fields: ["productId"],
        },
        {
          // Prevent duplicate items with same product, size, color
          unique: true,
          fields: ["cartId", "productId", "size", "color"],
          name: "unique_cart_item",
        },
      ],
    }
  );

  return CartItems;
}

const CartItemsPromise = defineCartItems().catch((error) => {
  console.error("Failed to define CartItems model:", error);
  throw error;
});

export { CartItemsPromise as CartItems };