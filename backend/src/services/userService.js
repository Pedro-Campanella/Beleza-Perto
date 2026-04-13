const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const env = require("../config/env");
const { addUser, findUserByEmail, findUserById, getUsers } = require("../data/database");
const { calculateDistanceKm } = require("../utils/geo");

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function createToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function findUserByIdSafe(userId) {
  return findUserById(userId) || null;
}

async function registerUser(input) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = findUserByEmail(normalizedEmail);
  if (existing) {
    const error = new Error("Email já cadastrado.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const isProvider = input.role === "professional" || input.role === "salon";

  const user = {
    id: randomUUID(),
    role: input.role,
    name: input.name.trim(),
    email: normalizedEmail,
    phone: input.phone?.trim() || "",
    passwordHash,
    services: isProvider ? [...new Set(input.services ?? [])] : [],
    bio: isProvider ? input.bio?.trim() || "" : "",
    rating: isProvider ? input.rating ?? 5 : null,
    reviewsCount: isProvider ? 0 : null,
    location: {
      address: input.address?.trim() || "",
      city: input.city?.trim() || "",
      lat: input.latitude ?? null,
      lng: input.longitude ?? null,
    },
    createdAt: new Date().toISOString(),
  };

  addUser(user);
  return user;
}

async function loginUser(input) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = findUserByEmail(normalizedEmail);

  if (!user) {
    const error = new Error("Credenciais inválidas.");
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    const error = new Error("Credenciais inválidas.");
    error.statusCode = 401;
    throw error;
  }

  return {
    token: createToken(user),
    user,
  };
}

function getOwnProfile(userId) {
  const user = findUserByIdSafe(userId);
  if (!user) {
    const error = new Error("Usuário não encontrado.");
    error.statusCode = 404;
    throw error;
  }
  return sanitizeUser(user);
}

function updateCurrentUser(currentUser, updates) {
  if (typeof updates.name === "string") currentUser.name = updates.name.trim();
  if (typeof updates.phone === "string") currentUser.phone = updates.phone.trim();
  if (typeof updates.city === "string") currentUser.location.city = updates.city.trim();
  if (typeof updates.address === "string") currentUser.location.address = updates.address.trim();
  if (updates.location) {
    currentUser.location = {
      ...currentUser.location,
      ...updates.location,
    };
  }

  if (currentUser.role !== "client") {
    if (Array.isArray(updates.services)) currentUser.services = [...new Set(updates.services)];
    if (typeof updates.bio === "string") currentUser.bio = updates.bio.trim();
  }

  return currentUser;
}

function listProviders({ service, minRating, lat, lng, maxDistanceKm, sortBy = "relevance" }) {
  const normalizedService = service?.trim().toLowerCase();

  const providers = getUsers()
    .filter((user) => user.role === "professional" || user.role === "salon")
    .filter((user) => (normalizedService ? user.services.includes(normalizedService) : true))
    .filter((user) => (typeof minRating === "number" ? user.rating >= minRating : true))
    .map((user) => {
      let distanceKm = null;
      if (
        typeof lat === "number" &&
        typeof lng === "number" &&
        typeof user.location.lat === "number" &&
        typeof user.location.lng === "number"
      ) {
        distanceKm = calculateDistanceKm(lat, lng, user.location.lat, user.location.lng);
      }

      return {
        ...sanitizeUser(user),
        distanceKm,
      };
    })
    .filter((user) =>
      typeof maxDistanceKm === "number" && user.distanceKm !== null
        ? user.distanceKm <= maxDistanceKm
        : true,
    );

  providers.sort((a, b) => {
    if (sortBy === "distance") {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    }

    if (sortBy === "rating") {
      return b.rating - a.rating;
    }

    const ratingDiff = b.rating - a.rating;
    if (ratingDiff !== 0) return ratingDiff;

    if (a.distanceKm === null && b.distanceKm === null) return 0;
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    return a.distanceKm - b.distanceKm;
  });

  return providers;
}

module.exports = {
  registerUser,
  loginUser,
  sanitizeUser,
  findUserById: findUserByIdSafe,
  getOwnProfile,
  updateCurrentUser,
  listProviders,
};
