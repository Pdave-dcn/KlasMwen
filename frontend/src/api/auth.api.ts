import api from "./api";

interface RegisterValues {
  username: string;
  email: string;
  password: string;
}

interface SignInValues {
  email: string;
  password: string;
}

type FormValues = SignInValues | RegisterValues;

const signIn = async (data: FormValues) => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

const signUp = async (data: FormValues) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

const logOut = async () => {
  const res = await api.post("/auth/logout", {});
  return res.data;
};

export { signIn, signUp, logOut };
