import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [step, setStep] = useState(1); // 1: Nhập pass, 2: Nhập OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }
  // YÊU CẦU GỬI OTP
  const handleRequestOTP = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!oldPassword || !newPassword) {
      setError("Vui lòng nhập đầy đủ mật khẩu.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      // Gọi API mới để xin mã OTP
      const res = await fetch("/api/auth/change-password/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Cần thiết để gửi JWT token đi
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Không thể gửi yêu cầu đổi mật khẩu");
      }

      const successMsg = await res.text(); // Lấy câu "Mã xác nhận đã được gửi..."
      setSuccess(successMsg);
      setStep(2); // Chuyển sang form nhập OTP
    } catch (err) {
      setError(err.message || "Yêu cầu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  //  XÁC NHẬN OTP VÀ ĐỔI MẬT KHẨU
  const handleVerifyChange = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setError("Vui lòng nhập mã OTP gồm 6 chữ số.");
      return;
    }

    setLoading(true);
    try {
      // Gọi API cũ nhưng giờ truyền thêm otp
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          oldPassword,
          newPassword,
          otp,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Đổi mật khẩu thất bại");
      }

      alert("Đổi mật khẩu thành công!");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Đổi mật khẩu thất bại.");
      if (err.message.toLowerCase().includes("hết hạn") || err.message.toLowerCase().includes("không chính xác")) {
        setOtp(""); // Xóa otp lỗi cho user gõ lại
      }
    } finally {
      setLoading(false);
    }
  };

  // Nếu chưa đăng nhập
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

        {/* HIỂN THỊ THÔNG BÁO LỖI / THÀNH CÔNG */}
        {error && <div style={errorStyle}>⚠️ {error}</div>}
        {success && <div style={successStyle}>✅ {success}</div>}

        {/* --- FORM BƯỚC 1 --- */}
        {step === 1 && (
          <form onSubmit={handleRequestOTP} style={form}>
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

            <div className="responsive-actions" style={actions}>
              <button type="button" style={secondaryBtn} onClick={() => navigate(-1)}>
                Quay lại
              </button>
              <button type="submit" style={primaryBtn} disabled={loading}>
                {loading ? "Đang xử lý..." : "Nhận mã OTP"}
              </button>
            </div>
          </form>
        )}

        {/* --- FORM BƯỚC 2 --- */}
        {step === 2 && (
          <form onSubmit={handleVerifyChange} style={form}>
            <label style={label}>Nhập mã xác nhận (6 số)</label>
            <input
              style={{ ...input, textAlign: "center", letterSpacing: "2px", fontSize: "18px" }}
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="VD: 123456"
            />

            <div className="responsive-actions" style={actions}>
              <button
                type="button"
                style={secondaryBtn}
                onClick={() => {
                  setStep(1);
                  setSuccess("");
                  setError("");
                }}
              >
                Quay lại sửa MK
              </button>
              <button type="submit" style={{ ...primaryBtn, background: "#52c41a" }} disabled={loading}>
                {loading ? "Đang xác nhận..." : "Hoàn tất đổi MK"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 🎨 STYLES
// ==========================================
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

// Hộp lỗi (Màu đỏ)
const errorStyle = {
  padding: "10px",
  marginBottom: "15px",
  borderRadius: "8px",
  background: "#fee2e2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  fontSize: "14px",
  fontWeight: "600",
};

// Hộp thành công (Màu xanh)
const successStyle = {
  padding: "10px",
  marginBottom: "15px",
  borderRadius: "8px",
  background: "#f6ffed",
  border: "1px solid #b7eb8f",
  color: "#389e0d",
  fontSize: "14px",
  fontWeight: "600",
};

const primaryBtn = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#1890ff",
  color: "white",
  fontWeight: "700",
  cursor: "pointer",
  flex: 1, // Để 2 nút chia đều chiều ngang
};

const secondaryBtn = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  background: "transparent",
  color: "#111827",
  fontWeight: "700",
  cursor: "pointer",
  flex: 1, // Để 2 nút chia đều chiều ngang
};