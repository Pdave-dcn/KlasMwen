import { BrowserRouter, Routes, Route } from "react-router-dom";

const Home = () => <h2>Home Page</h2>;
const Login = () => <h2>Login Page</h2>;
const Register = () => <h2>Register Page</h2>;
const NotFound = () => <h2>404 - Page Not Found</h2>;

const App = () => {
  return (
    <BrowserRouter>
      <div className="p-4">
        <h1 className="text-2xl mb-4">KlasMwen Project</h1>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
