import employeeService from '../service/employee.service.js';

const employeeController = {

  // ── Auth ──────────────────────────────────────────────────────────────────

  async login(req, res) {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) return res.status(400).json({ message: 'identifier and password required' });
      const result = await employeeService.login({ identifier, password });
      return res.status(200).json({ message: 'Login successful', ...result });
    } catch (err) {
      return res.status(401).json({ message: err.message });
    }
  },

  async logout(req, res) {
    try {
      await employeeService.logout(req.employee.id);
      return res.status(200).json({ message: 'Logged out' });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async getMe(req, res) {
    try {
      const emp = await employeeService.getEmployeeById(req.employee.id);
      return res.status(200).json({ data: emp });
    } catch (err) {
      return res.status(404).json({ message: err.message });
    }
  },

  // ── CRUD (admin) ──────────────────────────────────────────────────────────

  async create(req, res) {
    try {
      const emp = await employeeService.createEmployee({ ...req.body, created_by: req.user?.id });
      return res.status(201).json({ message: 'Employee created', data: emp });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async getAll(req, res) {
    try {
      const result = await employeeService.getEmployees(req.query);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const emp = await employeeService.getEmployeeById(req.params.id);
      return res.status(200).json({ data: emp });
    } catch (err) {
      return res.status(404).json({ message: err.message });
    }
  },

  async update(req, res) {
    try {
      const emp = await employeeService.updateEmployee(req.params.id, req.body);
      return res.status(200).json({ message: 'Updated', data: emp });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async remove(req, res) {
    try {
      await employeeService.deleteEmployee(req.params.id);
      return res.status(200).json({ message: 'Employee deactivated' });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  // ── Attendance ────────────────────────────────────────────────────────────

  async signIn(req, res) {
    try {
      const { selfie_base64, latitude, longitude, location_address } = req.body;
      const record = await employeeService.signIn(req.employee.id, {
        selfie_base64, latitude, longitude, location_address,
      });
      return res.status(200).json({ message: 'Signed in', data: record });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async signOut(req, res) {
    try {
      const record = await employeeService.signOut(req.employee.id);
      return res.status(200).json({ message: 'Signed out', data: record });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async getAttendance(req, res) {
    try {
      const result = await employeeService.getAttendance(req.employee.id, req.query);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async getEmployeeAttendance(req, res) {
    try {
      const result = await employeeService.getAttendance(req.params.id, req.query);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async getAllAttendance(req, res) {
    try {
      const result = await employeeService.getAllAttendance(req.query);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async markAttendance(req, res) {
    try {
      const record = await employeeService.markAttendance(req.body);
      return res.status(200).json({ message: 'Attendance marked', data: record });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async getAttendanceSummary(req, res) {
    try {
      const summary = await employeeService.getAttendanceSummary(req.query);
      return res.status(200).json({ data: summary });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async getEmployeeDocumentsAdmin(req, res) {
    try {
      const docs = await employeeService.getEmployeeDocuments(req.params.id);
      return res.status(200).json({ data: docs });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  // ── Leaves ────────────────────────────────────────────────────────────────

  async applyLeave(req, res) {
    try {
      const leave = await employeeService.applyLeave({ ...req.body, employee_id: req.employee.id });
      return res.status(201).json({ message: 'Leave applied', data: leave });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async getMyLeaves(req, res) {
    try {
      const result = await employeeService.getLeaves(req.employee.id, req.query);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async getLeaveBalance(req, res) {
    try {
      const balance = await employeeService.getLeaveBalance(req.employee.id);
      return res.status(200).json({ data: balance });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  // Admin leave management
  async getAllLeaves(req, res) {
    try {
      const result = await employeeService.getAllLeaves(req.query);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async updateLeaveStatus(req, res) {
    try {
      const leave = await employeeService.updateLeaveStatus(req.params.id, {
        ...req.body,
        approved_by: req.user?.id,
      });
      return res.status(200).json({ message: 'Leave status updated', data: leave });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  // ── Documents ─────────────────────────────────────────────────────────────

  async addDocument(req, res) {
    try {
      const doc = await employeeService.addDocument({ ...req.body, employee_id: req.employee.id });
      return res.status(201).json({ message: 'Document added', data: doc });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async getDocuments(req, res) {
    try {
      const docs = await employeeService.getDocuments(req.employee.id);
      return res.status(200).json({ data: docs });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async deleteDocument(req, res) {
    try {
      await employeeService.deleteDocument(req.params.docId, req.employee.id);
      return res.status(200).json({ message: 'Document removed' });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  // ── Payslip (employee) ────────────────────────────────────────────────────

  async getMyPayslips(req, res) {
    try {
      const payslips = await employeeService.getPayslips(req.employee.id);
      return res.status(200).json({ data: payslips });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async getMyPayslipById(req, res) {
    try {
      const p = await employeeService.getPayslipById(req.params.id);
      // ensure employee can only see their own
      if (p.employee_id !== req.employee.id) return res.status(403).json({ message: 'Access denied' });
      return res.status(200).json({ data: p });
    } catch (err) {
      return res.status(404).json({ message: err.message });
    }
  },

  // ── Payslip (admin) ───────────────────────────────────────────────────────

  async generatePayslip(req, res) {
    try {
      const p = await employeeService.generatePayslip({ ...req.body, generated_by: req.user?.id });
      return res.status(201).json({ message: 'Payslip generated', data: p });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async bulkGeneratePayslips(req, res) {
    try {
      const { month, year, include_pf = true, include_esi = true } = req.body;
      if (!month || !year) return res.status(400).json({ message: 'month and year required' });
      const results = await employeeService.bulkGeneratePayslips({
        month, year, include_pf, include_esi, generated_by: req.user?.id,
      });
      return res.status(200).json({
        message: `Generated ${results.success.length} payslips, ${results.failed.length} failed`,
        data: results,
      });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async getAllPayslips(req, res) {
    try {
      const result = await employeeService.getAllPayslips(req.query);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async getPayslipById(req, res) {
    try {
      const p = await employeeService.getPayslipById(req.params.id);
      return res.status(200).json({ data: p });
    } catch (err) {
      return res.status(404).json({ message: err.message });
    }
  },

  async updatePayslipStatus(req, res) {
    try {
      const p = await employeeService.updatePayslipStatus(req.params.id, req.body);
      return res.status(200).json({ message: 'Status updated', data: p });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async deletePayslip(req, res) {
    try {
      await employeeService.deletePayslip(req.params.id);
      return res.status(200).json({ message: 'Payslip deleted' });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  // ── Shift Rules ───────────────────────────────────────────────────────────

  async createShiftRule(req, res) {
    try {
      const rule = await employeeService.createShiftRule(req.body);
      return res.status(201).json({ message: 'Shift rule created', data: rule });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async getShiftRules(req, res) {
    try {
      const rules = await employeeService.getShiftRules();
      return res.status(200).json({ data: rules });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async updateShiftRule(req, res) {
    try {
      const rule = await employeeService.updateShiftRule(req.params.id, req.body);
      return res.status(200).json({ message: 'Updated', data: rule });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async deleteShiftRule(req, res) {
    try {
      await employeeService.deleteShiftRule(req.params.id);
      return res.status(200).json({ message: 'Shift rule deactivated' });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async getDefaultShiftRule(req, res) {
    try {
      const rule = await employeeService.getDefaultShiftRule();
      return res.status(200).json({ data: rule });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  // ── Leave Policy ──────────────────────────────────────────────────────────

  async getLeavePolicies(req, res) {
    try {
      const policies = await employeeService.getLeavePolicies();
      return res.status(200).json({ data: policies });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async createLeavePolicy(req, res) {
    try {
      const policy = await employeeService.createLeavePolicy(req.body);
      return res.status(201).json({ message: 'Leave policy created', data: policy });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async updateLeavePolicy(req, res) {
    try {
      const policy = await employeeService.updateLeavePolicy(req.params.id, req.body);
      return res.status(200).json({ message: 'Updated', data: policy });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  async deleteLeavePolicy(req, res) {
    try {
      await employeeService.deleteLeavePolicy(req.params.id);
      return res.status(200).json({ message: 'Leave policy removed' });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  // ── Advance Payment ───────────────────────────────────────────────────────

  async requestAdvance(req, res) {
    try {
      const adv = await employeeService.requestAdvance({ ...req.body, employee_id: req.employee.id });
      return res.status(201).json({ message: 'Advance request submitted', data: adv });
    } catch (err) { return res.status(400).json({ message: err.message }); }
  },

  async getMyAdvances(req, res) {
    try {
      const data = await employeeService.getMyAdvances(req.employee.id);
      return res.status(200).json({ data });
    } catch (err) { return res.status(400).json({ message: err.message }); }
  },

  async getAllAdvances(req, res) {
    try {
      const result = await employeeService.getAllAdvances(req.query);
      return res.status(200).json(result);
    } catch (err) { return res.status(400).json({ message: err.message }); }
  },

  async updateAdvanceStatus(req, res) {
    try {
      const adv = await employeeService.updateAdvanceStatus(req.params.id, {
        ...req.body, approved_by: req.user?.id,
      });
      return res.status(200).json({ message: 'Advance status updated', data: adv });
    } catch (err) { return res.status(400).json({ message: err.message }); }
  },

  async createAdvanceByAdmin(req, res) {
    try {
      const adv = await employeeService.createAdvanceByAdmin({
        ...req.body,
        approved_by: req.user?.id,
      });
      return res.status(201).json({ message: 'Advance created', data: adv });
    } catch (err) { return res.status(400).json({ message: err.message }); }
  },
};

export default employeeController;
