

import { useNavigate } from "react-router-dom";
import { removeUser } from "../utils/auth";

export default function AdminPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeUser();
    navigate("/login");
  };

  return (
    <div>
      <h2>Admin Page</h2>
      <button onClick={handleLogout}>Đăng xuất</button>
    </div>
  );
}