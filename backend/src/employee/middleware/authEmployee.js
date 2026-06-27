import jwt from 'jsonwebtoken';

const getSecret = () => process.env.JWT_SECRET || '3540e43edf1f1ed4811552d2b0d5a9fd1b4b23b8b7f0c48c83c621ed103454a6';

export const verifyEmployeeToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or malformed token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, getSecret());
    if (decoded.role !== 'employee') {
      return res.status(403).json({ message: 'Access denied: not an employee token' });
    }
    req.employee = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
