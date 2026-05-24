import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [user, setUser] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setError("");

    // ❌ validate trước
    if (!user.username || !user.password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);

    fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          try {
            // Thử dịch nếu Spring Boot trả về JSON báo lỗi hệ thống
            const errObj = JSON.parse(text);
            throw new Error(errObj.error || "Lỗi kết nối tới máy chủ");
          } catch (e) {
            // Nếu là chữ thường do mình tự viết ở Controller (VD: "Sai tài khoản...")
            throw new Error(text || "Sai tài khoản hoặc mật khẩu");
          }
        }
        return res.json();
      })
      // ... giữ nguyên đoạn .then(data => ...) bên dưới của bạn
      .then((data) => {
        // ✅ lưu user
        localStorage.setItem("user", JSON.stringify(data));

        // ✅ redirect về trang home cho mọi role
        navigate("/home");
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div style={containerStyle}>
      <form style={cardStyle} onSubmit={handleLogin}>
        <h2 style={{ marginBottom: "20px" }}>🎬 Đăng nhập</h2>

        <input
          name="username"
          placeholder="Tên đăng nhập"
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="password"
          type="password"
          placeholder="Mật khẩu"
          onChange={handleChange}
          style={inputStyle}
        />

        {/* ❌ lỗi */}
        {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <p style={{ marginTop: "15px" }}>
          Chưa có tài khoản?{" "}
          <span
            onClick={() => navigate("/register")}
            style={{ color: "blue", cursor: "pointer" }}
          >
            Đăng ký ngay
          </span>
        </p>
      </form>
    </div>
  );
}

// 🎨 Style
const containerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  background: "linear-gradient(to right, #1e3c72, #2a5298)",
};

const cardStyle = {
  width: "350px",
  padding: "30px",
  borderRadius: "15px",
  background: "white",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  textAlign: "center",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "15px",
  borderRadius: "8px",
  border: "1px solid #ccc",
};

const buttonStyle = {
  width: "100%",
  padding: "10px",
  background: "#ff4d4f",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};
