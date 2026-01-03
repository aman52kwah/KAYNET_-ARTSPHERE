'use strict';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
 
await queryInterface.createTable('Categories',
  {
        id:{
            type:DataTypes.UUID,
            defaultValue:DataTypes.UUIDV4,
            primaryKey:true,
        },
     
        name:{
            type:DataTypes.STRING,
            allowNull:false,
        },
        description:{
            type:DataTypes.STRING,
        },

    },
);
  
}
export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('Categories');
   
}
