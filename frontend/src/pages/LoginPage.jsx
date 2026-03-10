import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { saveUser } from "../utils/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/login", form);
      const user = res.data?.data?.user;

      if (!user) {
        setError("Không lấy được thông tin user");
        return;
      }

      saveUser(user);

      const roleCode = user?.role?.code;

      if (roleCode === "ADMIN") {
        navigate("/admin");
      } else if (roleCode === "MANAGER") {
        navigate("/manager");
      } else {
        navigate("/orders");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <br />

        <div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />
        </div>

        <br />

        <button type="submit">Login</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}