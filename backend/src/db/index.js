import { Sequelize } from "sequelize";
//mysql://dutch:DutchDB123@167.71.229.209:3306/duch
const sequelize = new Sequelize("mysql://dutch:DutchDB123@167.71.229.209:3306/demodutch", {
  dialect: "mysql",
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    connectTimeout: 30000,
  },
  logging: false,
});  // for Development
// const sequelize = new Sequelize("mysql://dutch:DutchDB123@localhost:3306/dutch"); // for deployment

sequelize.authenticate()
  .then(() => console.log("Database is Connected"))
  .catch((err) => console.warn(`DB connection warning: ${err.message}`));


export { sequelize };




// import { Sequelize } from "sequelize";

// const sequelize = new Sequelize("hms", "ramya", "ramya", {
//   host: "192.168.1.150",
//   port: 3306,
//   dialect: "mysql",
// });

// sequelize
//   .authenticate()
//   .then(() => console.log("Database is Connected"))
//   .catch((err) => console.error(`Database connection error: ${err}`));


// export { sequelize };




