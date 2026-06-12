import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_BASE_URL;
function CinemaCard({ cinema, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: "250px", // Cho thẻ to ra một chút nhìn cân đối hơn
        padding: "20px",
        borderRadius: "16px",
        background: "#111827", // Đổi sang màu nền thẻ Dark Mode
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)", // Đổ bóng đậm hơn
        cursor: "pointer",
        textAlign: "center",
        transition: "transform 0.3s ease",
        border: "1px solid #1f2937", // Viền nhẹ cho nổi bật thẻ
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {/* 🎯 BẮT LỖI CHỮ HOA/CHỮ THƯỜNG Ở ĐÂY */}
      <h2 style={{ color: "#ff4d4f", marginBottom: "10px" }}>
        {cinema?.Name || cinema?.name || "Tên rạp"}
      </h2>
      <p style={{ color: "#9ca3af", margin: 0 }}>
        📍 {cinema?.Location || cinema?.location || "Địa chỉ"}
      </p>
    </div>
  );
}

export default function Home() {
  const [cinemas, setCinemas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/api/cinemas`)
      .then((res) => res.json())
      .then((data) => setCinemas(data))
      .catch((error) => console.error("Lỗi khi tải dữ liệu rạp:", error));
  }, []);

  return (
    <div style={{ padding: "40px", background: "#0a0f1c", minHeight: "100vh" }}>
      <h1
        style={{
          textAlign: "center",
          color: "white",
          marginBottom: "40px",
          textTransform: "uppercase",
          letterSpacing: "2px",
        }}
      >
        🎬 Chọn rạp phim
      </h1>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "30px",
          flexWrap: "wrap",
        }}
      >
        {cinemas.map((cinema) => (
          <CinemaCard
            key={cinema.Id || cinema.id} // Bắt lỗi ID viết hoa
            cinema={cinema}
            onClick={() => navigate(`${API_BASE}/cinemapage/${cinema.Id || cinema.id}`)} // Bắt lỗi ID khi lấy link
          />
        ))}
      </div>
    </div>
  );
}
