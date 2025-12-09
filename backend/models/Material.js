import { DataTypes } from "sequelize";
import { sequelize as sequelizePromise } from '../db/db.js';

async function defineMaterial() {
    
     const sequelize = await sequelizePromise;

if(!sequelize){
    throw new Error(" Sequelize instance is undefined. Check db.js configuration.")
}

const Material = sequelize.define('Material', 
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
  pricePerMeter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
},
    {tablename:'material',
        timestamps:false,
    }
);

 return Material;
}

const MaterialPromise = defineMaterial().catch((error)=>{
    console.error('Failed to define Material model:',error);
    throw error;
});

export{MaterialPromise as Material};


