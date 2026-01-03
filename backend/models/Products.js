import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from "../db/db.js";
async function defineProducts() {
  const sequelize = await sequelizePromise;

  if (!sequelize) {
    throw new Error(
      "sequelize Sequelize instance is undefined. Check db.js configuration."
    );
  }

  const Products = sequelize.define(
    "Products",

    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Categories",
          key: "id",
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Product name is required",
          },
          len: {
            args: [2, 255],
            msg: "Product name must be between 2 and 255 characters",
          },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: {
            msg: "Price must be a valid decimal number",
          },
          min: {
            args: [0],
            msg: "Price cannot be negative",
          },
        },
      },
      compareAtPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: "Original price for showing discounts",
      },
      costPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: "Cost price for profit calculations",
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      colors: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: ["GRAY"],
        comment: "Available colors",
      },
      sizes: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
        comment: "Available sizes",
      },
      stockQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        validate: {
          min: {
            args: [0],
            msg: "Stock quantity cannot be negative",
          },
        },
      },
      lowStockThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        allowNull: false,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
        defaultValue: [],
        comment: "Multiple product images",
      },
      dimensions: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: "Dimensions: {length, width, height}",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isOnSale: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      soldCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      rating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0,
        allowNull: false,
        validate: {
          min: 0,
          max: 5,
        },
      },
      reviewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
      },
    },
    {
      tableName: "Payments",
      timestamps: true,
    }
  );
  return Products;
}

const ProductPromise = defineProducts().catch((error) => {
  console.error("Failed to define Product model:", error);
  throw error;
});
export { ProductPromise as Products };