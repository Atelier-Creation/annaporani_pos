import Employee from './employee.model.js';
import Attendance from './attendance.model.js';
import Leave from './leave.model.js';
import EmployeeDocument from './document.model.js';
import Payslip from './payslip.model.js';
import ShiftRule from './shiftrule.model.js';
import LeavePolicy from './leavepolicy.model.js';
import Advance from './advance.model.js';

Employee.hasMany(Attendance,       { foreignKey: 'employee_id', as: 'attendances' });
Attendance.belongsTo(Employee,     { foreignKey: 'employee_id', as: 'employee' });

Employee.hasMany(Leave,            { foreignKey: 'employee_id', as: 'leaves' });
Leave.belongsTo(Employee,          { foreignKey: 'employee_id', as: 'employee' });

Employee.hasMany(EmployeeDocument, { foreignKey: 'employee_id', as: 'documents' });
EmployeeDocument.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });

Employee.hasMany(Payslip,          { foreignKey: 'employee_id', as: 'payslips' });
Payslip.belongsTo(Employee,        { foreignKey: 'employee_id', as: 'employee' });

Employee.hasMany(Advance,          { foreignKey: 'employee_id', as: 'advances' });
Advance.belongsTo(Employee,        { foreignKey: 'employee_id', as: 'employee' });

export { Employee, Attendance, Leave, EmployeeDocument, Payslip, ShiftRule, LeavePolicy, Advance };
