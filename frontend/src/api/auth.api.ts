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
  const res = await api.post("/auth/login", data, { withCredentials: true });
  return res.data;
};

const signUp = async (data: FormValues) => {
  const res = await api.post("/auth/register", data, { withCredentials: true });
  return res.data;
};

const logout = async () => {
  await api.post("/auth/logout", {}, { withCredentials: true });
};

export { signIn, signUp, logout };
