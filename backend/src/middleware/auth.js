
import jwt from 'jsonwebtoken';

// Get secret at runtime, not at module load time
const getSecretKey = () => process.env.JWT_SECRET || "3540e43edf1f1ed4811552d2b0d5a9fd1b4b23b8b7f0c48c83c621ed103454a6";

export const verifyToken = (req, res, next) => {
    console.log('\n=== VERIFY TOKEN DEBUG ===');
    const authHeader = req.headers['authorization'];
    console.log('1. Auth header exists:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('2. ERROR: Missing or malformed token');
        console.log('==========================\n');
        return res.status(401).json({ message: 'Missing or malformed token' });
    }

    const token = authHeader.split(' ')[1];
    const SECRET_KEY = getSecretKey(); // Get secret at runtime

    console.log('2. Token extracted (first 50 chars):', token.substring(0, 50) + '...');
    console.log('3. Using SECRET_KEY (first 20 chars):', SECRET_KEY.substring(0, 20) + '...');

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        console.log('4. Token verified successfully');
        console.log('5. Decoded user ID:', decoded.id);
        console.log('6. Decoded username:', decoded.username);
        console.log('==========================\n');
        req.user = decoded; // Attach decoded user payload to request
        next(); // Token is valid, proceed
    } catch (err) {
        console.log('4. ERROR: Token verification failed');
        console.log('5. Error name:', err.name);
        console.log('6. Error message:', err.message);
        console.log('==========================\n');
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

/**
 * authorize(codes) — permission-based access control middleware.
 *
 * Usage example:
 *   router.get('/billing', verifyToken, authorize(['billing.view']), billingController.getAll);
 *
 * The JWT payload must include a `permissions` array of permission codes.
 * The user is granted access if they have AT LEAST ONE of the required codes.
 * Super Admin (role_name === 'super_admin') bypasses all permission checks.
 *
 * @param {string[]} codes - Required permission codes (at least one must match)
 */
export const authorize = (codes = []) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    // Super admin bypasses all permission checks
    if (req.user.role_name === 'super_admin') {
        return next();
    }

    const userPermissions = req.user.permissions || [];
    const hasAccess = codes.some(code => userPermissions.includes(code));

    if (!hasAccess) {
        return res.status(403).json({
            message: 'Forbidden: insufficient permissions',
            required: codes,
        });
    }

    next();
};
