-- Add missing columns to attendance table
ALTER TABLE `attendance`
  ADD COLUMN IF NOT EXISTS `is_late` TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `late_minutes` INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `is_permission` TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `permission_hours` DECIMAL(4,2) DEFAULT 0;

-- Update attendance status ENUM to include new values
ALTER TABLE `attendance`
  MODIFY COLUMN `status` ENUM('present','absent','half_day','holiday','leave','late','permission') DEFAULT 'present';

-- Add advance_deduction to payslips table
ALTER TABLE `payslips`
  ADD COLUMN IF NOT EXISTS `advance_deduction` DECIMAL(10,2) DEFAULT 0;

-- These tables will be auto-created by sequelize.sync() on next restart:
-- shift_rules, leave_policies, employee_advances, payslips
