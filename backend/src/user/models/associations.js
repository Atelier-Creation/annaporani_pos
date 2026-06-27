import User from './user.model.js';
import Role from './role.model.js';
import Branch from './branch.model.js';
import UserBranch from './userbranch.model.js';
import Permission from './permission.model.js';
import RolePermission from './rolepermission.model.js';

// User belongs to Role
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// Role <-> Permission (many-to-many through RolePermission)
Role.belongsToMany(Permission, {
    through: RolePermission,
    foreignKey: 'role_id',
    otherKey: 'permission_id',
    as: 'permissions',
});
Permission.belongsToMany(Role, {
    through: RolePermission,
    foreignKey: 'permission_id',
    otherKey: 'role_id',
    as: 'roles',
});

// User has many Branches through UserBranch
User.belongsToMany(Branch, {
    through: UserBranch,
    foreignKey: 'user_id',
    otherKey: 'branch_id',
    as: 'branches'
});

Branch.belongsToMany(User, {
    through: UserBranch,
    foreignKey: 'branch_id',
    otherKey: 'user_id',
    as: 'users'
});

// Direct associations for UserBranch
UserBranch.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserBranch.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });
UserBranch.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

export { User, Role, Branch, UserBranch, Permission, RolePermission };
