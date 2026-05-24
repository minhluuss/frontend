import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!oldPassword || !newPassword) {
      setMessage("Vui lòng nhập đầy đủ mật khẩu.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Đổi mật khẩu thất bại");
      }

      setMessage("Đổi mật khẩu thành công.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage(err.message || "Đổi mật khẩu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={pageWrap}>
        <div style={card}>
          <h2 style={title}>Đổi mật khẩu</h2>
          <p style={text}>Bạn cần đăng nhập để đổi mật khẩu.</p>
          <button style={primaryBtn} onClick={() => navigate("/login")}>
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      <div style={card}>
        <h2 style={title}>Đổi mật khẩu</h2>
        <form onSubmit={handleSubmit} style={form}>
          <label style={label}>Mật khẩu cũ</label>
          <input
            style={input}
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />

          <label style={label}>Mật khẩu mới</label>
          <input
            style={input}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <label style={label}>Xác nhận mật khẩu mới</label>
          <input
            style={input}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {message && <div style={messageStyle}>{message}</div>}

          <div style={actions}>
            <button
              type="button"
              style={secondaryBtn}
              onClick={() => navigate(-1)}
            >
              Quay lại
            </button>
            <button type="submit" style={primaryBtn} disabled={loading}>
              {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const pageWrap = {
  minHeight: "100vh",
  background: "linear-gradient(to right, #1e3c72, #2a5298)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "30px",
};

const card = {
  width: "100%",
  maxWidth: "350px",
  background: "white",
  borderRadius: "15px",
  padding: "30px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  color: "#111827",
};

const title = {
  margin: 0,
  marginBottom: "18px",
  fontSize: "22px",
  fontWeight: "800",
};

const text = {
  color: "#374151",
  marginBottom: "20px",
};

const form = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const label = {
  fontSize: "14px",
  fontWeight: "700",
  color: "#374151",
};

const input = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  background: "white",
  color: "#111827",
  outline: "none",
};

const actions = {
  display: "flex",
  gap: "10px",
  marginTop: "10px",
};

const messageStyle = {
  padding: "10px",
  borderRadius: "8px",
  background: "#fee2e2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  fontWeight: "600",
};

const primaryBtn = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#ff4d4f",
  color: "white",
  fontWeight: "700",
  cursor: "pointer",
};

const secondaryBtn = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  background: "transparent",
  color: "#111827",
  fontWeight: "700",
  cursor: "pointer",
};


