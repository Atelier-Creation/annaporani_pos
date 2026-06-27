import Inward from "./inward.model.js";
import InwardItem from "./inwarditeam.model.js";
import Branch from "../../user/models/branch.model.js";

// InwardItem associations are already defined in inwarditeam.model.js
// Just add Branch association here
Inward.belongsTo(Branch, {
  foreignKey: "branch_id",
  as: "branch",
});

Branch.hasMany(Inward, {
  foreignKey: "branch_id",
  as: "inwards",
});

export { Inward, InwardItem, Branch };
