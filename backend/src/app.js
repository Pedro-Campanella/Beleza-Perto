const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/usersRoutes");
const providersRoutes = require("./routes/providersRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "beleza-perto-api" });
});

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/providers", providersRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({ message: "Erro interno do servidor" });
});

module.exports = app;
