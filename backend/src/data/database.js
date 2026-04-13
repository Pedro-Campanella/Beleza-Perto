const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");

const defaultPasswordHash = bcrypt.hashSync("123456", 10);

const users = [
  {
    id: randomUUID(),
    role: "professional",
    name: "Mariana Souza",
    email: "mariana@belezaperto.com",
    phone: "(11) 99888-1111",
    passwordHash: defaultPasswordHash,
    location: {
      city: "São Paulo",
      address: "Rua Augusta, 500",
      lat: -23.5569,
      lng: -46.6587,
    },
    services: ["unha", "cabelos"],
    bio: "Especialista em alongamento de unhas e escova modelada.",
    rating: 4.8,
    reviewsCount: 58,
    createdAt: new Date().toISOString(),
  },
  {
    id: randomUUID(),
    role: "salon",
    name: "Studio Bella Mulher",
    email: "contato@studiobella.com",
    phone: "(11) 97777-2222",
    passwordHash: defaultPasswordHash,
    location: {
      city: "São Paulo",
      address: "Av. Paulista, 1200",
      lat: -23.5642,
      lng: -46.6524,
    },
    services: ["cabelos", "cilios", "estetica"],
    bio: "Salão completo com foco em cabelo, cílios e estética facial.",
    rating: 4.6,
    reviewsCount: 121,
    createdAt: new Date().toISOString(),
  },
];

function getUsers() {
  return users;
}

function addUser(user) {
  users.push(user);
  return user;
}

function findUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  return users.find((user) => user.email.toLowerCase() === normalizedEmail);
}

function findUserById(id) {
  return users.find((user) => user.id === id);
}

module.exports = {
  getUsers,
  addUser,
  findUserByEmail,
  findUserById,
};
