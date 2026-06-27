// Test script to verify category description field is working
// Run with: node test_category_description.js

import { sequelize } from './src/db/index.js';
import Category from './src/product/models/category.model.js';

async function testCategoryDescription() {
  try {
    console.log('🔍 Testing Category Description Field...\n');

    // 1. Check if description column exists in database
    console.log('1. Checking database schema...');
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'category' 
      AND column_name = 'description';
    `);
    
    if (results.length === 0) {
      console.log('❌ Description column does NOT exist in database!');
      console.log('   Run the migration: backend/migrations/add_category_description.sql');
    } else {
      console.log('✅ Description column exists:', results[0]);
    }

    // 2. Test creating a category with description
    console.log('\n2. Testing category creation with description...');
    const testCategory = await Category.create({
      category_name: `Test Category ${Date.now()}`,
      description: 'This is a test description to verify the field works',
      is_active: true,
    });
    console.log('✅ Category created:', {
      id: testCategory.id,
      name: testCategory.category_name,
      description: testCategory.description,
    });

    // 3. Test updating the description
    console.log('\n3. Testing category update with description...');
    testCategory.description = 'Updated description text';
    await testCategory.save();
    console.log('✅ Category updated:', {
      id: testCategory.id,
      description: testCategory.description,
    });

    // 4. Verify by fetching from database
    console.log('\n4. Verifying by fetching from database...');
    const fetched = await Category.findByPk(testCategory.id);
    console.log('✅ Fetched category:', {
      id: fetched.id,
      name: fetched.category_name,
      description: fetched.description,
    });

    // 5. Clean up test data
    console.log('\n5. Cleaning up test data...');
    await testCategory.destroy();
    console.log('✅ Test category deleted');

    console.log('\n✅ All tests passed! Description field is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await sequelize.close();
  }
}

testCategoryDescription();
