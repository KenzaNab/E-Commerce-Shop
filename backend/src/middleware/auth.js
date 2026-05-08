const jwt = require('jsonwebtoken');
const auth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token.' });
  try { req.userId = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET).id; next(); }
  catch { res.status(401).json({ error: 'Invalid token.' }); }
};
module.exports = auth;
