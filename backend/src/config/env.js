const dotenv = require("dotenv");

dotenv.config();

const env = {
  port: Number(process.env.PORT) || 3333,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-troque-em-producao",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
};

module.exports = env;
