import { Sequelize } from 'sequelize';
import 'dotenv/config';

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  { 
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,

    dialectOptions: {
      dateStrings: true, 
      typeCast: function (field, next) {
        if (field.type === "DATETIME" || field.type === "TIMESTAMP") {
          return field.string();
        }
        return next();
      }
    },
    timezone: "+07:00" 
  }
);
