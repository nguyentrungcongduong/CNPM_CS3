import { useNavigate } from "react-router-dom";
import { removeUser } from "../utils/auth";
import api from "../api/axios";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.log("Logout API error:", error);
    } finally {
      removeUser();
      navigate("/login");
    }
  };

  return <button onClick={handleLogout}>Đăng xuất</button>;
}