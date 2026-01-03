'use strict';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
 await queryInterface.createTable('Style', 
  {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type:DataTypes.TEXT
},
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  imageUrl: {type:DataTypes.STRING,

  },

  categoryId: {
    type: DataTypes.UUID,
  },

});
   
}
export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Style');
}
