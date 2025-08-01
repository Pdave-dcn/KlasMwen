import jwtStrategy from "./strategies/jwtStrategy.js";
import localStrategy from "./strategies/localStrategy.js";

import type { PassportStatic } from "passport";

const initializePassport = (passport: PassportStatic) => {
  passport.use("local", localStrategy);
  passport.use("jwt", jwtStrategy);
};

export default initializePassport;
