import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [user, setUser] = useState({
    username: "",
    password: "",
    email: "",
  });

  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); 
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // GỌI API /api/auth/register ĐỂ GỬI OTP
  const handleRequestOTP = (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!user.username || !user.password || !user.email) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    const emailRegex = /^[A-Za-z0-9+_.-]+@(.+)$/;
    if (!emailRegex.test(user.email)) {
      setError("Email không hợp lệ");
      return;
    }

    if (user.password.length < 6) {
      setError("Mật khẩu phải >= 6 ký tự");
      return;
    }

    setLoading(true);
    // 🔥 Sửa ở đây: Gọi đúng API đăng ký của Backend để tạo mã OTP
    fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Gửi nguyên cục user (vì Backend @RequestBody User user)
      body: JSON.stringify(user), 
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Lỗi khi đăng ký / gửi OTP");
        }
        setStep(2);
        alert("Mã OTP đã được gửi đến email của bạn!");
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  // ==========================================
  // BƯỚC 2: GỌI API /api/auth/register/verify ĐỂ CHỐT
  // ==========================================
  const handleVerifyRegister = (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Vui lòng nhập mã OTP gồm 6 chữ số");
      return;
    }

    setLoading(true);
    // 🔥 Sửa ở đây: Gọi đúng API verify của Backend
    fetch("/api/auth/register/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // BE yêu cầu object VerifyRequest { email, code }
      body: JSON.stringify({ email: user.email, code: otp }), 
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "OTP không hợp lệ hoặc đã hết hạn");
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
      <div
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
      >
        <h2 style={{ marginBottom: "20px" }}>📝 Đăng ký</h2>

        {step === 1 && (
          <form onSubmit={handleRequestOTP} style={{ width: "100%" }}>
            <input name="username" value={user.username} placeholder="Tên đăng nhập" onChange={handleChange} style={inputStyle} />
            <input name="email" value={user.email} placeholder="Email" onChange={handleChange} style={inputStyle} />
            <input name="password" type="password" value={user.password} placeholder="Mật khẩu" onChange={handleChange} style={inputStyle} />

            {error && <p style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>{error}</p>}

            <button type="submit" style={buttonStyle} disabled={loading}>
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </button>

            <p style={{ marginTop: "15px", fontSize: "14px" }}>
              Đã có tài khoản? <span onClick={() => navigate("/login")} style={{ color: "blue", cursor: "pointer" }}>Đăng nhập</span>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyRegister} style={{ width: "100%" }}>
            <p style={{ marginBottom: "15px", fontSize: "14px", color: "green" }}>
              Mã xác nhận đã được gửi tới: <strong>{user.email}</strong>
            </p>

            <input
              name="otp"
              value={otp}
              placeholder="Nhập mã OTP 6 số"
              onChange={(e) => setOtp(e.target.value)}
              style={{ ...inputStyle, textAlign: "center", letterSpacing: "2px", fontSize: "18px" }}
              maxLength={6}
            />

            {error && <p style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>{error}</p>}

            <button type="submit" style={{ ...buttonStyle, background: "#52c41a" }} disabled={loading}>
              {loading ? "Đang xác nhận..." : "Xác nhận & Hoàn tất"}
            </button>

            <p style={{ marginTop: "15px", fontSize: "14px" }}>
              <span onClick={() => setStep(1)} style={{ color: "blue", cursor: "pointer", marginRight: "15px" }}>
                ← Quay lại sửa thông tin
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px",
  marginBottom: "12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  display: "block",
};

const buttonStyle = {
  width: "100%",
  padding: "10px",
  background: "#1890ff",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  transition: "0.3s",
};