import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from "../db/db.js";
async function defineStyle() {
  const sequelize = await sequelizePromise;

  if (!sequelize) {
    throw new Error(
      "sequelize Sequelize instance is undefined. Check db.js configuration."
    );
  }

  const Style = sequelize.define(
    "Style",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      basePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      imageUrl: { type: DataTypes.STRING },

      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Categories",
          key: "id",
        },
      },
    },
    {
      tableName: "Style",
      timestamps: true,
      indexes: [{ fields: ["basePrice"] }, { fields: ["categoryId"] }],
    }
  );

  Style.associate = function (models) {
    Style.belongsTo(models.Category, {
      foreignKey: "categoryId",
      as: "category",
    });
  };

  return Style;
}
const StylePromise = defineStyle().catch((error)=>{
    console.error("Failed to define style model:", error);
    throw error;
});

export{StylePromise as Style};