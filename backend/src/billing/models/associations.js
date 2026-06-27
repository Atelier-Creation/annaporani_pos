import Billing from './billing.models.js';
import BillingItem from './billingiteam.models.js';
import Customer from './customer.model.js';
import Product from '../../product/models/product.model.js';
import Branch from '../../user/models/branch.model.js';

// Billing has many BillingItems
Billing.hasMany(BillingItem, { foreignKey: 'billing_id', as: 'items' });
BillingItem.belongsTo(Billing, { foreignKey: 'billing_id', as: 'billing' });

// BillingItem belongs to Product
BillingItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(BillingItem, { foreignKey: 'product_id', as: 'billingItems' });

// Billing belongs to Customer (using customer_phone as foreign key)
Billing.belongsTo(Customer, { 
    foreignKey: 'customer_phone', 
    targetKey: 'customer_phone',
    as: 'customer' 
});
Customer.hasMany(Billing, { 
    foreignKey: 'customer_phone',
    sourceKey: 'customer_phone',
    as: 'billings' 
});

// Billing belongs to Branch
Billing.belongsTo(Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
});
Branch.hasMany(Billing, {
    foreignKey: 'branch_id',
    as: 'billings'
});

export { Billing, BillingItem, Customer, Product, Branch };
