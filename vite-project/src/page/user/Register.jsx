import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [user, setUser] = useState({
    username: "",
    password: "",
    email: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleRegister = (e) => {
    if (e) e.preventDefault();
    setError("");

    // ❌ validate rỗng
    if (!user.username || !user.password || !user.email) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    // ❌ validate email
    const emailRegex = /^[A-Za-z0-9+_.-]+@(.+)$/;
    if (!emailRegex.test(user.email)) {
      setError("Email không hợp lệ");
      return;
    }

    // ❌ password ngắn
    if (user.password.length < 6) {
      setError("Mật khẩu phải >= 6 ký tự");
      return;
    }

    setLoading(true);
    fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }
        return res.text();
      })
      .then(() => {
        alert("Đăng ký thành công 🎉");
        navigate("/login");
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "24px 12px",
        background: "linear-gradient(to right, #1e3c72, #2a5298)",
      }}
    >
      <form
        style={{
          width: "min(100%, 400px)",
          padding: "28px 20px",
          borderRadius: "15px",
          background: "white",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
        onSubmit={handleRegister}
      >
        <h2 style={{ marginBottom: "20px" }}>📝 Đăng ký</h2>

        <input
          name="username"
          value={user.username}
          placeholder="Tên đăng nhập"
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="email"
          value={user.email}
          placeholder="Email"
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          name="password"
          type="password"
          value={user.password}
          placeholder="Mật khẩu"
          onChange={handleChange}
          style={inputStyle}
        />

        {/* ❌ Hiển thị lỗi */}
        {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>

        {/* 👇 quay lại login */}
        <p style={{ marginTop: "15px" }}>
          Đã có tài khoản?{" "}
          <span
            onClick={() => navigate("/login")}
            style={{ color: "blue", cursor: "pointer" }}
          >
            Đăng nhập
          </span>
        </p>
      </form>
    </div>
  );
}

// 🎨 Style
const inputStyle = {
  width: "100%",
  maxWidth: "320px",
  padding: "10px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  display: "block",
};

const buttonStyle = {
  width: "100%",
  maxWidth: "320px",
  padding: "10px",
  background: "#1890ff",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};
