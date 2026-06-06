import { useNavigate, Outlet, useLocation } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="admin-layout">
      {/* 📌 SIDEBAR (Thanh menu bên trái) */}
      <div className="admin-sidebar">
        <h2
          style={{ textAlign: "center", marginBottom: "30px", color: "white" }}
        >
          🎬 Quản trị
        </h2>

        <div className="admin-menu" style={menuContainerStyle}>
          {/* 👇 Đã thêm chữ "Quản lý Phim" vào đây 👇 */}
          <button
            style={
              location.pathname.includes("/admin/add-movie")
                ? activeBtn
                : menuBtn
            }
            onClick={() => navigate("/admin/add-movie")}
          >
            Thêm Phim
          </button>

          <button
            style={
              location.pathname.includes("/admin/add-cinema")
                ? activeBtn
                : menuBtn
            }
            onClick={() => navigate("/admin/add-cinema")}
          >
            Quản lý Rạp
          </button>

          <button
            style={
              location.pathname.includes("/admin/add-room")
                ? activeBtn
                : menuBtn
            }
            onClick={() => navigate("/admin/add-room")}
          >
            Quản lý Phòng
          </button>
          <button
            style={
              location.pathname.includes("/admin/seat-management")
                ? activeBtn
                : menuBtn
            }
            onClick={() => navigate("/admin/seat-management")}
          >
            Quản lý Ghế
          </button>

          <button
            style={
              location.pathname.includes("/admin/add-showtime")
                ? activeBtn
                : menuBtn
            }
            onClick={() => navigate("/admin/add-showtime")}
          >
            Thêm Suất Chiếu
          </button>

          <button
            style={
              location.pathname.includes("/admin/booking-report")
                ? activeBtn
                : menuBtn
            }
            onClick={() => navigate("/admin/booking-report")}
          >
            Thống Kê Đặt Vé
          </button>

          <button
            style={
              location.pathname.includes("/admin/revenue-report")
                ? activeBtn
                : menuBtn
            }
            onClick={() => navigate("/admin/revenue-report")}
          >
            Thống Kê Doanh Thu
          </button>
        </div>

        <button style={logoutBtn} onClick={handleLogout}>
          Đăng xuất
        </button>
        <button style={backBtn} onClick={() => navigate("/home")}>
          Quay lại
        </button>
      </div>

      {/* 📌 MAIN CONTENT (Nội dung thay đổi bên phải) */}
      <div className="admin-content">
        {/* Component <Outlet /> sẽ hiển thị nội dung của AddMovie vào đây */}
        <Outlet />
      </div>
    </div>
  );
}

// 🎨 STYLE
const sidebarStyle = {
  width: "250px",
  background: "#001529",
  color: "white",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
};
const menuContainerStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};
const menuBtn = {
  padding: "12px",
  background: "transparent",
  color: "#a6adb4",
  border: "none",
  textAlign: "left",
  fontSize: "16px",
  cursor: "pointer",
  borderRadius: "8px",
};
const activeBtn = { ...menuBtn, background: "#1890ff", color: "white" };
// Thêm marginTop: "auto" để nút Đăng xuất luôn nằm ở cuối cùng
const logoutBtn = {
  padding: "12px",
  background: "#ff4d4f",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};
const backBtn = {
  padding: "12px",
  background: "#1890ff",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  marginTop: "12px",
};
