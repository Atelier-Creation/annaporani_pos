import { Router } from 'express';
import employeeController from '../controller/employee.controller.js';
import { verifyEmployeeToken } from '../middleware/authEmployee.js';
import { verifyToken } from '../../middleware/auth.js';

const router = Router();

// ── Public (employee auth) ────────────────────────────────────────────────
router.post('/employee/login', employeeController.login);

// ── Employee self-service (requires employee token) ───────────────────────
router.post('/employee/logout', verifyEmployeeToken, employeeController.logout);
router.get('/employee/me', verifyEmployeeToken, employeeController.getMe);

// Attendance
router.post('/employee/attendance/sign-in', verifyEmployeeToken, employeeController.signIn);
router.post('/employee/attendance/sign-out', verifyEmployeeToken, employeeController.signOut);
router.get('/employee/attendance', verifyEmployeeToken, employeeController.getAttendance);

// Leaves
router.post('/employee/leaves', verifyEmployeeToken, employeeController.applyLeave);
router.get('/employee/leaves', verifyEmployeeToken, employeeController.getMyLeaves);
router.get('/employee/leaves/balance', verifyEmployeeToken, employeeController.getLeaveBalance);

// Documents
router.post('/employee/documents', verifyEmployeeToken, employeeController.addDocument);
router.get('/employee/documents', verifyEmployeeToken, employeeController.getDocuments);
router.delete('/employee/documents/:docId', verifyEmployeeToken, employeeController.deleteDocument);

// ── Admin HRMS routes (requires admin/user token) ─────────────────────────
router.post('/hrms/employees', verifyToken, employeeController.create);
router.get('/hrms/employees', verifyToken, employeeController.getAll);
router.get('/hrms/employees/:id', verifyToken, employeeController.getById);
router.put('/hrms/employees/:id', verifyToken, employeeController.update);
router.delete('/hrms/employees/:id', verifyToken, employeeController.remove);

// Admin attendance view
router.get('/hrms/attendance/summary', verifyToken, employeeController.getAttendanceSummary);
router.get('/hrms/attendance', verifyToken, employeeController.getAllAttendance);
router.post('/hrms/attendance', verifyToken, employeeController.markAttendance);
router.get('/hrms/employees/:id/attendance', verifyToken, employeeController.getEmployeeAttendance);

// Admin employee documents
router.get('/hrms/employees/:id/documents', verifyToken, employeeController.getEmployeeDocumentsAdmin);

// Admin leave management
router.get('/hrms/leaves', verifyToken, employeeController.getAllLeaves);
router.put('/hrms/leaves/:id/status', verifyToken, employeeController.updateLeaveStatus);

// ── Payslip — employee self-service ──────────────────────────────────────
router.get('/employee/payslips', verifyEmployeeToken, employeeController.getMyPayslips);
router.get('/employee/payslips/:id', verifyEmployeeToken, employeeController.getMyPayslipById);

// ── Payslip — admin ───────────────────────────────────────────────────────
router.post('/hrms/payslips/generate', verifyToken, employeeController.generatePayslip);
router.post('/hrms/payslips/bulk-generate', verifyToken, employeeController.bulkGeneratePayslips);
router.get('/hrms/payslips', verifyToken, employeeController.getAllPayslips);
router.get('/hrms/payslips/:id', verifyToken, employeeController.getPayslipById);
router.put('/hrms/payslips/:id/status', verifyToken, employeeController.updatePayslipStatus);
router.delete('/hrms/payslips/:id', verifyToken, employeeController.deletePayslip);

// ── Shift Rules ───────────────────────────────────────────────────────────────
router.get('/hrms/shift-rules/default', verifyToken, employeeController.getDefaultShiftRule);
router.get('/hrms/shift-rules', verifyToken, employeeController.getShiftRules);
router.post('/hrms/shift-rules', verifyToken, employeeController.createShiftRule);
router.put('/hrms/shift-rules/:id', verifyToken, employeeController.updateShiftRule);
router.delete('/hrms/shift-rules/:id', verifyToken, employeeController.deleteShiftRule);

// Employee can view default shift rule
router.get('/employee/shift-rule', verifyEmployeeToken, employeeController.getDefaultShiftRule);

// ── Leave Policies ────────────────────────────────────────────────────────────
router.get('/hrms/leave-policies', verifyToken, employeeController.getLeavePolicies);
router.post('/hrms/leave-policies', verifyToken, employeeController.createLeavePolicy);
router.put('/hrms/leave-policies/:id', verifyToken, employeeController.updateLeavePolicy);
router.delete('/hrms/leave-policies/:id', verifyToken, employeeController.deleteLeavePolicy);

// Employee can view leave policies
router.get('/employee/leave-policies', verifyEmployeeToken, employeeController.getLeavePolicies);

// ── Advance Payment ───────────────────────────────────────────────────────────
router.post('/employee/advances', verifyEmployeeToken, employeeController.requestAdvance);
router.get('/employee/advances', verifyEmployeeToken, employeeController.getMyAdvances);

router.get('/hrms/advances', verifyToken, employeeController.getAllAdvances);
router.post('/hrms/advances', verifyToken, employeeController.createAdvanceByAdmin);
router.put('/hrms/advances/:id/status', verifyToken, employeeController.updateAdvanceStatus);

export default router;
