export const requireAuth = (req, res, next) => {
  // Check session first (for email/password login)
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // Check passport authentication (for Google OAuth)
  if (req.isAuthenticated && req.isAuthenticated()) {
    req.user = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    };
    return next();
  }

  return res.status(401).json({ message: 'Authentication required' });
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
};