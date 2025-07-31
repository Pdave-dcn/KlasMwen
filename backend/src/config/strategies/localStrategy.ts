import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import prisma from "../db.js";

const localStrategy = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
  },
  async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) return done(null, false, { message: "User not found." });

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return done(null, false, { message: "Incorrect Password" });

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
);

export default localStrategy;
