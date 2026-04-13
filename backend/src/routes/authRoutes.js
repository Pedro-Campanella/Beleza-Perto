const express = require("express");
const { z } = require("zod");
const { ensureAuth } = require("../middleware/authMiddleware");
const userService = require("../services/userService");

const router = express.Router();
const roleSchema = z.enum(["client", "professional", "salon"]);
const serviceSchema = z.enum(["unha", "cilios", "cabelos", "estetica", "maquiagem", "sobrancelha"]);

const registerSchema = z
  .object({
    role: roleSchema,
    name: z.string().trim().min(2),
    email: z.string().trim().email(),
    password: z.string().min(6),
    phone: z.string().trim().min(8).optional(),
    city: z.string().trim().min(2),
    address: z.string().trim().min(3).optional(),
    bio: z.string().trim().max(400).optional(),
    services: z.array(serviceSchema).min(1).optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
  .superRefine((data, ctx) => {
    if (data.role !== "client" && (!data.services || data.services.length === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["services"],
        message: "Profissionais e salões precisam informar ao menos 1 serviço.",
      });
    }
  });

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Dados inválidos para cadastro.",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const result = await userService.registerUser(parsed.data);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Erro ao cadastrar usuário.",
    });
  }
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Dados inválidos para login.",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const result = await userService.loginUser(parsed.data);
    return res.json(result);
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Erro no login.",
    });
  }
});

router.get("/me", ensureAuth, (req, res) => {
  const user = userService.findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Usuário não encontrado." });
  }

  return res.json({ user: userService.sanitizeUser(user) });
});

module.exports = router;
