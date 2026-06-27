import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { generateToken, generateRefreshToken } from '../../utils/token.js';
import Employee from '../models/employee.model.js';
import Attendance from '../models/attendance.model.js';
import Leave from '../models/leave.model.js';
import EmployeeDocument from '../models/document.model.js';
import Payslip from '../models/payslip.model.js';
import ShiftRule from '../models/shiftrule.model.js';
import LeavePolicy from '../models/leavepolicy.model.js';
import Advance from '../models/advance.model.js';
import '../models/associations.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Selfie storage directory ──────────────────────────────────────────────────
// Store in backend/public/selfies — served as static files by the backend
const SELFIE_DIR = path.join(__dirname, '../../../public/selfies');
if (!fs.existsSync(SELFIE_DIR)) fs.mkdirSync(SELFIE_DIR, { recursive: true });

// ── IST helpers (UTC+5:30) ────────────────────────────────────────────────────
const getISTDate = () => {
  const now = new Date();
  // Add 5h 30m offset to UTC
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  return ist.toISOString().split('T')[0]; // YYYY-MM-DD
};

const getISTTime = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  return ist.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
};

const employeeService = {

  // ── Auth ──────────────────────────────────────────────────────────────────

  async login({ identifier, password }) {
    const employee = await Employee.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { phone: identifier }],
        is_active: true,
      },
    });
    if (!employee) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, employee.password);
    if (!valid) throw new Error('Invalid credentials');

    const token = generateToken({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      employee_code: employee.employee_code,
      role: 'employee',
    });
    const refreshToken = generateRefreshToken({ id: employee.id });

    await employee.update({ token });

    const data = employee.get({ plain: true });
    delete data.password;
    delete data.token;

    return { employee: data, token, refreshToken };
  },

  async logout(id) {
    await Employee.update({ token: null }, { where: { id } });
  },

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async createEmployee({ name, email, password, phone, department, designation,
    date_of_joining, date_of_birth, gender, address, salary, employment_type, created_by }) {
    const exists = await Employee.findOne({ where: { email } });
    if (exists) throw new Error('Email already exists');

    const hashed = await bcrypt.hash(password, 10);

    // Auto-generate employee code
    const count = await Employee.count();
    const employee_code = `EMP-${String(count + 1001).padStart(4, '0')}`;

    const emp = await Employee.create({
      employee_code, name, email, password: hashed, phone,
      department, designation, date_of_joining, date_of_birth,
      gender, address, salary, employment_type, created_by,
    });

    const data = emp.get({ plain: true });
    delete data.password;
    delete data.token;
    return data;
  },

  async getEmployees({ page = 1, limit = 10, search = '' } = {}) {
    const offset = (page - 1) * limit;
    const where = { is_active: true };
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { employee_code: { [Op.like]: `%${search}%` } },
        { department: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows } = await Employee.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'token'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });
    return { data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } };
  },

  async getEmployeeById(id) {
    const emp = await Employee.findByPk(id, { attributes: { exclude: ['password', 'token'] } });
    if (!emp) throw new Error('Employee not found');
    return emp;
  },

  async updateEmployee(id, data) {
    const emp = await Employee.findByPk(id);
    if (!emp) throw new Error('Employee not found');
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    await emp.update(data);
    const updated = emp.get({ plain: true });
    delete updated.password;
    delete updated.token;
    return updated;
  },

  async deleteEmployee(id) {
    await Employee.update({ is_active: false }, { where: { id } });
  },

  // ── Attendance ────────────────────────────────────────────────────────────

  async signIn(employee_id, { selfie_base64, latitude, longitude, location_address } = {}) {
    const today = getISTDate();
    const existing = await Attendance.findOne({ where: { employee_id, date: today } });
    if (existing?.sign_in) throw new Error('Already signed in today');

    // Save selfie image
    let selfie_url = null;
    const selfie_expires_at = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // +3 days

    if (selfie_base64) {
      const base64Data = selfie_base64.replace(/^data:image\/\w+;base64,/, '');
      const filename   = `signin_${employee_id}_${Date.now()}.jpg`;
      const filepath   = path.join(SELFIE_DIR, filename);
      fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
      selfie_url = `/selfies/${filename}`;
    }

    const signInTime = getISTTime();
    const payload = {
      sign_in: signInTime,
      status: 'present',
      selfie_url,
      latitude:  latitude  || null,
      longitude: longitude || null,
      location_address: location_address || null,
      selfie_expires_at: selfie_base64 ? selfie_expires_at : null,
    };

    if (existing) {
      await existing.update(payload);
      return existing;
    }
    return await Attendance.create({ employee_id, date: today, ...payload });
  },

  async signOut(employee_id) {
    const today = getISTDate();
    const record = await Attendance.findOne({ where: { employee_id, date: today } });
    if (!record || !record.sign_in) throw new Error('No sign-in found for today');
    if (record.sign_out) throw new Error('Already signed out today');

    const signOutTime = getISTTime();
    // Calculate hours
    const [inH, inM, inS] = record.sign_in.split(':').map(Number);
    const [outH, outM, outS] = signOutTime.split(':').map(Number);
    const hours = ((outH * 3600 + outM * 60 + outS) - (inH * 3600 + inM * 60 + inS)) / 3600;

    await record.update({ sign_out: signOutTime, hours_worked: Math.max(0, hours).toFixed(2) });
    return record;
  },

  async getAttendance(employee_id, { month, year, page = 1, limit = 31 } = {}) {
    const where = { employee_id };
    if (month && year) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = new Date(year, month, 0).toISOString().split('T')[0];
      where.date = { [Op.between]: [start, end] };
    }
    const { count, rows } = await Attendance.findAndCountAll({
      where,
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });
    return { data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } };
  },

  // Admin: get all attendance across all employees with optional filters
  async getAllAttendance({ month, year, employee_id, page = 1, limit = 50 } = {}) {
    const where = {};
    if (employee_id) where.employee_id = employee_id;
    if (month && year) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = new Date(year, month, 0).toISOString().split('T')[0];
      where.date = { [Op.between]: [start, end] };
    }
    const { count, rows } = await Attendance.findAndCountAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'name', 'employee_code', 'department'] }],
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });
    return { data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } };
  },

  // Admin: manually mark/update attendance for an employee
  async markAttendance({ employee_id, date, sign_in, sign_out, status, notes, is_permission, permission_hours }) {
    const existing = await Attendance.findOne({ where: { employee_id, date } });

    // Calculate hours worked
    let hours_worked = null;
    if (sign_in && sign_out) {
      const toSec = t => { const [h,m,s] = t.split(':').map(Number); return h*3600+m*60+(s||0); };
      const diff = (toSec(sign_out) - toSec(sign_in)) / 3600;
      hours_worked = Math.max(0, diff).toFixed(2);
    }

    // Apply shift rules to determine status automatically
    let finalStatus = status;
    let is_late = false;
    let late_minutes = 0;

    if (sign_in && !status) {
      const rule = await ShiftRule.findOne({ where: { is_default: true, is_active: true } })
        || await ShiftRule.findOne({ where: { is_active: true } });

      if (rule) {
        const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
        const shiftStartMin = toMin(rule.shift_start);
        const signInMin     = toMin(sign_in);
        late_minutes = Math.max(0, signInMin - shiftStartMin);

        if (late_minutes > rule.absent_after_minutes) {
          finalStatus = 'absent';
        } else if (late_minutes > rule.half_day_after_minutes) {
          finalStatus = 'half_day';
        } else if (late_minutes > rule.late_mark_after_minutes) {
          finalStatus = 'late';
          is_late = true;
        } else {
          finalStatus = 'present';
        }

        // Override with hours-based check if sign_out present
        if (sign_out && hours_worked !== null) {
          const hw = parseFloat(hours_worked);
          if (hw < parseFloat(rule.min_hours_half_day)) {
            finalStatus = is_permission ? 'permission' : 'half_day';
          } else if (hw < parseFloat(rule.min_hours_full_day)) {
            finalStatus = is_permission ? 'permission' : 'half_day';
          } else {
            finalStatus = late_minutes > rule.late_mark_after_minutes ? 'late' : 'present';
            is_late = late_minutes > rule.late_mark_after_minutes;
          }
        }
      } else {
        finalStatus = finalStatus || 'present';
      }
    }

    const payload = {
      sign_in, sign_out, status: finalStatus || status || 'present',
      notes, hours_worked, is_late, late_minutes,
      is_permission: is_permission || false,
      permission_hours: permission_hours || 0,
    };

    if (existing) {
      await existing.update(payload);
      return existing;
    }
    return await Attendance.create({ employee_id, date, ...payload });
  },

  // ── Shift Rules ───────────────────────────────────────────────────────────

  async createShiftRule(data) {
    // If setting as default, unset others
    if (data.is_default) {
      await ShiftRule.update({ is_default: false }, { where: {} });
    }
    return await ShiftRule.create(data);
  },

  async getShiftRules() {
    return await ShiftRule.findAll({ where: { is_active: true }, order: [['createdAt', 'DESC']] });
  },

  async getShiftRuleById(id) {
    const rule = await ShiftRule.findByPk(id);
    if (!rule) throw new Error('Shift rule not found');
    return rule;
  },

  async updateShiftRule(id, data) {
    const rule = await ShiftRule.findByPk(id);
    if (!rule) throw new Error('Shift rule not found');
    if (data.is_default) {
      await ShiftRule.update({ is_default: false }, { where: {} });
    }
    await rule.update(data);
    return rule;
  },

  async deleteShiftRule(id) {
    await ShiftRule.update({ is_active: false }, { where: { id } });
  },

  async getDefaultShiftRule() {
    return await ShiftRule.findOne({ where: { is_default: true, is_active: true } })
      || await ShiftRule.findOne({ where: { is_active: true } });
  },

  // Admin: get attendance summary stats for dashboard
  async getAttendanceSummary({ month, year } = {}) {
    const now = new Date();
    const m = month || (now.getMonth() + 1);
    const y = year || now.getFullYear();
    const start = `${y}-${String(m).padStart(2, '0')}-01`;
    const end = new Date(y, m, 0).toISOString().split('T')[0];

    const total = await Employee.count({ where: { is_active: true } });
    const today = getISTDate();
    const presentToday = await Attendance.count({ where: { date: today, status: 'present' } });
    const onLeaveToday = await Attendance.count({ where: { date: today, status: 'leave' } });
    const absentToday = total - presentToday - onLeaveToday;

    return { total_employees: total, present_today: presentToday, on_leave_today: onLeaveToday, absent_today: Math.max(0, absentToday) };
  },

  // Admin: get documents for any employee
  async getEmployeeDocuments(employee_id) {
    return await EmployeeDocument.findAll({
      where: { employee_id, is_active: true },
      order: [['createdAt', 'DESC']],
    });
  },

  // ── Leaves ────────────────────────────────────────────────────────────────

  async applyLeave({ employee_id, leave_type, from_date, to_date, days, reason }) {
    return await Leave.create({ employee_id, leave_type, from_date, to_date, days, reason });
  },

  async getLeaves(employee_id, { page = 1, limit = 10 } = {}) {
    const { count, rows } = await Leave.findAndCountAll({
      where: { employee_id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });
    return { data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } };
  },

  async getAllLeaves({ page = 1, limit = 10, status } = {}) {
    const where = {};
    if (status) where.status = status;
    const { count, rows } = await Leave.findAndCountAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'name', 'employee_code', 'department'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });
    return { data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } };
  },

  async updateLeaveStatus(id, { status, rejection_reason, approved_by }) {
    const leave = await Leave.findByPk(id);
    if (!leave) throw new Error('Leave not found');
    await leave.update({ status, rejection_reason, approved_by, approved_at: new Date() });

    // When approved → mark each date in the range as 'leave' in attendance
    if (status === 'approved') {
      const start = new Date(leave.from_date);
      const end   = new Date(leave.to_date);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const existing = await Attendance.findOne({
          where: { employee_id: leave.employee_id, date: dateStr },
        });
        if (existing) {
          // Only overwrite if not already a holiday
          if (existing.status !== 'holiday') {
            await existing.update({ status: 'leave', notes: `Leave approved: ${leave.leave_type}` });
          }
        } else {
          await Attendance.create({
            employee_id: leave.employee_id,
            date: dateStr,
            status: 'leave',
            notes: `Leave approved: ${leave.leave_type}`,
          });
        }
      }
    }

    // When rejected/cancelled → revert those dates back to absent (if they were marked as leave)
    if (status === 'rejected' || status === 'cancelled') {
      const start = new Date(leave.from_date);
      const end   = new Date(leave.to_date);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const existing = await Attendance.findOne({
          where: { employee_id: leave.employee_id, date: dateStr, status: 'leave' },
        });
        if (existing) {
          await existing.update({ status: 'absent', notes: `Leave ${status}: reverted` });
        }
      }
    }

    return leave;
  },

  async getLeaveBalance(employee_id) {
    const year = new Date().getFullYear();
    const start = `${year}-01-01`;
    const end   = `${year}-12-31`;

    // Fetch approved leaves for this employee this year
    const leaves = await Leave.findAll({
      where: {
        employee_id,
        status: 'approved',
        from_date: { [Op.between]: [start, end] },
      },
    });

    const used = {};
    leaves.forEach(l => {
      used[l.leave_type] = (used[l.leave_type] || 0) + parseFloat(l.days);
    });

    // Fetch dynamic policies from DB
    const policies = await LeavePolicy.findAll({ where: { is_active: true } });

    const balance = {};
    policies.forEach(p => {
      const entitled  = parseFloat(p.days_per_year);
      const usedDays  = used[p.leave_type] || 0;
      balance[p.leave_type] = {
        label:            p.label,
        entitled,
        used:             usedDays,
        remaining:        Math.max(0, entitled - usedDays),
        carry_forward:    p.carry_forward,
        max_carry_forward: parseFloat(p.max_carry_forward_days),
        requires_approval: p.requires_approval,
        applicable_gender: p.applicable_gender,
      };
    });

    return balance;
  },

  // ── Leave Policy CRUD ─────────────────────────────────────────────────────

  async getLeavePolicies() {
    return await LeavePolicy.findAll({ where: { is_active: true }, order: [['leave_type', 'ASC']] });
  },

  async updateLeavePolicy(id, data) {
    const policy = await LeavePolicy.findByPk(id);
    if (!policy) throw new Error('Leave policy not found');
    await policy.update(data);
    return policy;
  },

  async createLeavePolicy(data) {
    const exists = await LeavePolicy.findOne({ where: { leave_type: data.leave_type } });
    if (exists) throw new Error('Policy for this leave type already exists');
    return await LeavePolicy.create(data);
  },

  async deleteLeavePolicy(id) {
    await LeavePolicy.update({ is_active: false }, { where: { id } });
  },

  // ── Advance Payment ───────────────────────────────────────────────────────

  async requestAdvance({ employee_id, amount, reason, requested_date }) {
    return await Advance.create({ employee_id, amount, reason, requested_date: requested_date || new Date() });
  },

  async createAdvanceByAdmin({ employee_id, amount, reason, requested_date, status, admin_notes, paid_date, deduct_month, deduct_year, approved_by }) {
    return await Advance.create({
      employee_id,
      amount,
      reason,
      requested_date: requested_date || new Date(),
      status: status || 'approved',
      admin_notes,
      approved_by,
      approved_at: new Date(),
      paid_date: paid_date || null,
      deduct_month: deduct_month || null,
      deduct_year:  deduct_year  || null,
    });
  },

  async getMyAdvances(employee_id) {
    return await Advance.findAll({
      where: { employee_id },
      order: [['createdAt', 'DESC']],
    });
  },

  async getAllAdvances({ status, page = 1, limit = 50 } = {}) {
    const where = {};
    if (status) where.status = status;
    const { count, rows } = await Advance.findAndCountAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'name', 'employee_code', 'department'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });
    return { data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } };
  },

  async updateAdvanceStatus(id, { status, approved_by, admin_notes, rejection_reason, paid_date, deduct_month, deduct_year }) {
    const advance = await Advance.findByPk(id);
    if (!advance) throw new Error('Advance request not found');
    await advance.update({
      status,
      approved_by,
      admin_notes,
      rejection_reason,
      approved_at: ['approved', 'paid'].includes(status) ? new Date() : advance.approved_at,
      paid_date: status === 'paid' ? (paid_date || new Date()) : advance.paid_date,
      deduct_month: deduct_month || advance.deduct_month,
      deduct_year:  deduct_year  || advance.deduct_year,
    });
    return advance;
  },

  // ── Documents ─────────────────────────────────────────────────────────────

  async addDocument({ employee_id, document_name, document_type, file_url, file_name }) {
    return await EmployeeDocument.create({ employee_id, document_name, document_type, file_url, file_name });
  },

  async getDocuments(employee_id) {
    return await EmployeeDocument.findAll({
      where: { employee_id, is_active: true },
      order: [['createdAt', 'DESC']],
    });
  },

  async deleteDocument(id, employee_id) {
    const doc = await EmployeeDocument.findOne({ where: { id, employee_id } });
    if (!doc) throw new Error('Document not found');
    await doc.update({ is_active: false });
  },

  // ── Payslip ───────────────────────────────────────────────────────────────

  async generatePayslip({ employee_id, month, year, bonus = 0, other_allowance = 0,
    tax_deduction = 0, other_deduction = 0, notes = '', generated_by,
    include_pf = true, include_esi = true }) {

    const emp = await Employee.findByPk(employee_id);
    if (!emp) throw new Error('Employee not found');

    const gross_base = parseFloat(emp.salary) || 0;

    // Attendance for the month
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end   = new Date(year, month, 0).toISOString().split('T')[0];
    const attRecords = await Attendance.findAll({ where: { employee_id, date: { [Op.between]: [start, end] } } });

    const working_days = new Date(year, month, 0).getDate();
    const present_days = attRecords.filter(a => a.status === 'present').length;
    const leave_days   = attRecords.filter(a => a.status === 'leave').length;
    const absent_days  = Math.max(0, working_days - present_days - leave_days);

    // Pro-rata salary based on attendance (deduct for absent days)
    const payable_days = present_days + leave_days;
    const attendance_factor = working_days > 0 ? payable_days / working_days : 1;

    // Standard salary split (adjusted for attendance)
    const basic_salary   = parseFloat((gross_base * 0.50 * attendance_factor).toFixed(2));
    const hra             = parseFloat((gross_base * 0.20 * attendance_factor).toFixed(2));
    const transport_allowance = parseFloat((gross_base * 0.10 * attendance_factor).toFixed(2));
    const other_allow     = parseFloat(other_allowance) || 0;
    const bonusAmt        = parseFloat(bonus) || 0;
    const gross_salary    = parseFloat((basic_salary + hra + transport_allowance + other_allow + bonusAmt).toFixed(2));

    // Deductions
    const pf_deduction    = include_pf  ? parseFloat((basic_salary * 0.12).toFixed(2)) : 0;
    const esi_deduction   = include_esi && gross_salary <= 21000 ? parseFloat((gross_salary * 0.0075).toFixed(2)) : 0;
    const taxDed          = parseFloat(tax_deduction) || 0;
    const otherDed        = parseFloat(other_deduction) || 0;
    const total_deductions = parseFloat((pf_deduction + esi_deduction + taxDed + otherDed).toFixed(2));    const net_salary      = parseFloat((gross_salary - total_deductions).toFixed(2));

    // Upsert (one payslip per employee per month/year)
    // Deduct approved advances for this month
    const advances = await Advance.findAll({
      where: {
        employee_id,
        status: 'paid',
        deduct_month: month,
        deduct_year: year,
        deducted_in_payslip_id: null,
      },
    });
    const advance_deduction = parseFloat(advances.reduce((s, a) => s + parseFloat(a.amount), 0).toFixed(2));
    const final_net = parseFloat((net_salary - advance_deduction).toFixed(2));

    await Payslip.upsert({
      employee_id, month, year,
      basic_salary, hra, transport_allowance,
      other_allowance: other_allow, bonus: bonusAmt,
      gross_salary, pf_deduction, esi_deduction,
      tax_deduction: taxDed, other_deduction: otherDed,
      total_deductions, net_salary: final_net,
      advance_deduction,
      working_days, present_days, leave_days, absent_days,
      status: 'generated', notes, generated_by,
    });

    const payslip = await Payslip.findOne({
      where: { employee_id, month, year },
      include: [{ model: Employee, as: 'employee', attributes: { exclude: ['password', 'token'] } }],
    });

    // Mark advances as deducted
    if (advances.length > 0) {
      await Advance.update(
        { status: 'deducted', deducted_in_payslip_id: payslip.id },
        { where: { id: advances.map(a => a.id) } }
      );
    }

    return payslip;
  },

  // Bulk generate payslips for all active employees
  async bulkGeneratePayslips({ month, year, generated_by, include_pf = true, include_esi = true }) {
    const employees = await Employee.findAll({ where: { is_active: true } });
    const results = { success: [], failed: [] };

    for (const emp of employees) {
      try {
        await this.generatePayslip({
          employee_id: emp.id,
          month, year,
          bonus: 0, other_allowance: 0,
          tax_deduction: 0, other_deduction: 0,
          notes: `Auto-generated · PF: ${include_pf ? 'Yes' : 'No'} · ESI: ${include_esi ? 'Yes' : 'No'}`,
          generated_by, include_pf, include_esi,
        });
        results.success.push({ id: emp.id, name: emp.name, employee_code: emp.employee_code });
      } catch (err) {
        results.failed.push({ id: emp.id, name: emp.name, error: err.message });
      }
    }
    return results;
  },

  async getPayslips(employee_id) {
    return await Payslip.findAll({
      where: { employee_id },
      order: [['year', 'DESC'], ['month', 'DESC']],
    });
  },

  async getPayslipById(id) {
    const p = await Payslip.findByPk(id, {
      include: [{ model: Employee, as: 'employee', attributes: { exclude: ['password', 'token'] } }],
    });
    if (!p) throw new Error('Payslip not found');
    return p;
  },

  async getAllPayslips({ page = 1, limit = 20, month, year, employee_id } = {}) {
    const where = {};
    if (month) where.month = month;
    if (year)  where.year  = year;
    if (employee_id) where.employee_id = employee_id;
    const { count, rows } = await Payslip.findAndCountAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'name', 'employee_code', 'department', 'designation'] }],
      order: [['year', 'DESC'], ['month', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });
    return { data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / limit) } };
  },

  async updatePayslipStatus(id, { status, payment_date }) {
    const p = await Payslip.findByPk(id);
    if (!p) throw new Error('Payslip not found');
    await p.update({ status, payment_date });
    return p;
  },

  async deletePayslip(id) {
    const p = await Payslip.findByPk(id);
    if (!p) throw new Error('Payslip not found');
    await p.destroy();
  },
};

// ── Selfie cleanup job — runs every hour, deletes expired selfie files ─────────
function runSelfieCleanup() {
  setInterval(async () => {
    try {
      const expired = await Attendance.findAll({
        where: {
          selfie_url: { [Op.ne]: null },
          selfie_expires_at: { [Op.lt]: new Date() },
        },
      });
      for (const record of expired) {
        if (record.selfie_url) {
          const filepath = path.join(SELFIE_DIR, path.basename(record.selfie_url));
          if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        }
        await record.update({ selfie_url: null, selfie_expires_at: null });
      }
      if (expired.length > 0) console.log(`[Selfie Cleanup] Deleted ${expired.length} expired selfie(s)`);
    } catch (err) {
      console.error('[Selfie Cleanup] Error:', err.message);
    }
  }, 60 * 60 * 1000); // every hour
}
runSelfieCleanup();

export default employeeService;
