const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authorization token missing"
    });
  }

  const token = authHeader.split(" ")[1];

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

req.userId = decoded.id || decoded.userId;

if (!req.userId) {
  return res.status(401).json({
    message: "Invalid token payload"
  });
}

next();

  } catch (error) {

    res.status(401).json({
      message: "Invalid or expired token"
    });

  }

};

module.exports = authMiddleware;