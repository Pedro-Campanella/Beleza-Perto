const express = require("express");
const { z } = require("zod");
const { ensureAuth } = require("../middleware/authMiddleware");
const userService = require("../services/userService");

const router = express.Router();
const serviceSchema = z.enum(["unha", "cilios", "cabelos", "estetica", "maquiagem", "sobrancelha"]);

const updateSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    phone: z.string().trim().min(8).optional(),
    city: z.string().trim().min(2).optional(),
    address: z.string().trim().min(3).optional(),
    bio: z.string().trim().max(400).optional(),
    services: z.array(serviceSchema).min(1).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  })
  .refine(
    (data) => {
      if (data.lat === undefined && data.lng === undefined) {
        return true;
      }
      return data.lat !== undefined && data.lng !== undefined;
    },
    {
      message: "Envie lat e lng juntos para atualizar localização.",
      path: ["lat"],
    },
  );

router.get("/me", ensureAuth, (req, res) => {
  const user = userService.findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Usuário não encontrado." });
  }

  return res.json({ user: userService.sanitizeUser(user) });
});

router.put("/me", ensureAuth, (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Dados inválidos para atualização",
      errors: parsed.error.flatten(),
    });
  }

  const currentUser = userService.findUserById(req.user.id);
  if (!currentUser) {
    return res.status(404).json({ message: "Usuário não encontrado." });
  }

  const updates = { ...parsed.data };
  if (parsed.data.services) {
    updates.services = [...new Set(parsed.data.services)];
  }

  if (parsed.data.lat !== undefined && parsed.data.lng !== undefined) {
    updates.location = {
      ...currentUser.location,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
    };
  }

  delete updates.lat;
  delete updates.lng;

  const updatedUser = userService.updateCurrentUser(currentUser, updates);
  return res.json({ user: userService.sanitizeUser(updatedUser) });
});

module.exports = router;
