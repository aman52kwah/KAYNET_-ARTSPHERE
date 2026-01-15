// models/CustomOrders.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/db.js';

const CustomOrder = sequelize.then((seq) =>
  seq.define(
    "CustomOrder",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // Foreign Keys
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },

      // Personal Information
      fullName: {
        type: DataTypes.STRING,
        allowNull: true, // Made nullable for backward compatibility
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Style Selection
      garmentType: {
        type: DataTypes.STRING, // 'dress', 'suit', 'shirt', etc.
        allowNull: true,
      },
      garmentLabel: {
        type: DataTypes.STRING, // 'Dress', 'Suit', 'Shirt', etc.
        allowNull: true,
      },
      style: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      occasion: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Measurements (stored as JSON)
      measurements: {
        type: DataTypes.JSON,
        allowNull: true,
        // Example: { bust: "36", waist: "28", hips: "38", shoulder: "16", sleeves: "24", length: "42" }
      },

      // Material & Design
      fabricType: {
        type: DataTypes.STRING, // 'cotton', 'silk', 'linen', etc.
        allowNull: true,
      },
      fabricLabel: {
        type: DataTypes.STRING, // 'Cotton', 'Silk', 'Linen', etc.
        allowNull: true,
      },
      fabricColor: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      designDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      referenceImageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // Timeline & Priority
      urgency: {
        type: DataTypes.STRING, // 'standard', 'express', 'rush'
        allowNull: true,
        defaultValue: "standard",
      },
      urgencyLabel: {
        type: DataTypes.STRING, // 'Standard (3-4 weeks)', etc.
        allowNull: true,
      },
      specialRequests: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Pricing
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      depositAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      balanceAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },

      // Shipping
      shippingAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Status Tracking
      status: {
        type: DataTypes.ENUM(
          "pending",
          "in_progress",
          "completed",
          "cancelled"
        ),
        defaultValue: "pending",
        allowNull: true,
      },
      paymentStatus: {
        type: DataTypes.ENUM("deposit_pending", "deposit_paid", "fully_paid"),
        defaultValue: "deposit_pending",
        allowNull: true,
      },

      // Optional: Legacy fields if you had them
      styleId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Style",
          key: "id",
        },
      },
      materialId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Material",
          key: "id",
        },
      },
    },
    {
      tableName: "CustomOrders",
      timestamps: true,
    }
  )
);

// Export as named export to match your import pattern
export { CustomOrder };