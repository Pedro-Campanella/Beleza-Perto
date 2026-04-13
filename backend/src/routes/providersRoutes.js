const express = require("express");
const { z } = require("zod");
const userService = require("../services/userService");

const providersRoutes = express.Router();

const searchSchema = z
  .object({
    service: z.string().trim().optional(),
    minRating: z
      .string()
      .optional()
      .transform((value) => (value ? Number(value) : undefined))
      .refine((value) => value === undefined || (value >= 0 && value <= 5), {
        message: "minRating deve estar entre 0 e 5",
      }),
    lat: z
      .string()
      .optional()
      .transform((value) => (value ? Number(value) : undefined)),
    lng: z
      .string()
      .optional()
      .transform((value) => (value ? Number(value) : undefined)),
    maxDistanceKm: z
      .string()
      .optional()
      .transform((value) => (value ? Number(value) : undefined))
      .refine((value) => value === undefined || value > 0, {
        message: "maxDistanceKm deve ser maior que zero",
      }),
    sortBy: z.enum(["distance", "rating", "relevance"]).optional().default("relevance"),
  })
  .refine(
    (data) => {
      if (data.sortBy !== "distance") {
        return true;
      }
      return data.lat !== undefined && data.lng !== undefined;
    },
    {
      path: ["sortBy"],
      message: "Para ordenar por distancia envie lat e lng.",
    },
  );

providersRoutes.get("/", (request, response) => {
  const parsed = searchSchema.safeParse(request.query);
  if (!parsed.success) {
    return response.status(400).json({
      message: "Parametros invalidos",
      errors: parsed.error.flatten(),
    });
  }

  const providers = userService.listProviders(parsed.data);
  return response.json({ providers, total: providers.length });
});

module.exports = providersRoutes;
