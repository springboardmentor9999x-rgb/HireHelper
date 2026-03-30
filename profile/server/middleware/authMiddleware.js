const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "supersecretkey"
      );

      req.user = { id: decoded.id };

      next();
    } catch (error) {
      return res.status(401).json({ error: "Not authorized" });
    }
  }

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
};

module.exports = protect;
