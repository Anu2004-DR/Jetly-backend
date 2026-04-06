const prisma = require("../../config/prisma");
const bcrypt = require("bcrypt");

const registerUser = async ({ name, email, password }) => {

  if (!name || !email || !password) {
    throw new Error("Name, email and password are required");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return user;
};
const loginUser = async ({ email, password }) => {

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  return user;
};

module.exports = {
  registerUser,
  loginUser,
};