// import { sequelize } from "../src/db/index.js";
// import User from "../src/user/models/user.model.js";
// import Role from "../src/user/models/role.model.js";

// async function syncDatabase() {
//   try {
//     await sequelize.sync({ alter: true });
//     console.log("Database synchronized successfully");
//   } catch (err) {
//     console.error("Error syncing database:", err.message);
//     throw err
//   }
// }

// syncDatabase().then((data) => console.log("synced")).catch((err)=> console.error("error"));


import { sequelize } from "../src/db/index.js";
import Billing from "../src/billing/models/billing.models.js";
import BillingItem from "../src/billing/models/billingiteam.models.js";
import Product from "../src/product/models/product.model.js";
import "../src/billing/models/associations.js";

console.log("Billing associations:", Object.keys(Billing.associations));
console.log("BillingItem associations:", Object.keys(BillingItem.associations));

async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database synchronized successfully");
  } catch (err) {
    console.error("Error syncing database:", err.message);
    throw err;
  }
}

syncDatabase()
  .then(() => console.log("synced"))
  .catch((err) => console.error("error", err));
