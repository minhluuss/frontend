import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={footerWrapper}>
      <div style={footerContainer}>
        {/* Cột 1: Giới thiệu */}
        <div style={columnStyle}>
          <h3 style={brandStyle}>🎥 CinemaBooking</h3>
          <p style={textStyle}>
            Hệ thống đặt vé xem phim trực tuyến hàng đầu. Mang đến cho bạn những trải nghiệm điện ảnh tuyệt vời nhất với chất lượng dịch vụ đỉnh cao.
          </p>
        </div>

        {/* Cột 2: Khám phá (Góc điện ảnh) */}
        <div style={columnStyle}>
          <h4 style={titleStyle}>Góc Điện Ảnh</h4>
          <ul style={listStyle}>
            <li><Link to="" style={linkStyle}>Phim đang chiếu</Link></li>
            <li><Link to="" style={linkStyle}>Phim sắp chiếu</Link></li>
            <li><Link to="" style={linkStyle}>Lịch chiếu phim</Link></li>
            <li><Link to="" style={linkStyle}>Khuyến mãi & Sự kiện</Link></li>
          </ul>
        </div>

        {/* Cột 3: Hỗ trợ */}
        <div style={columnStyle}>
          <h4 style={titleStyle}>Hỗ trợ khách hàng</h4>
          <ul style={listStyle}>
            <li><Link to="" style={linkStyle}>Hướng dẫn đặt vé</Link></li>
            <li><Link to="" style={linkStyle}>Điều khoản sử dụng</Link></li>
            <li><Link to="" style={linkStyle}>Chính sách bảo mật</Link></li>
            <li><Link to="" style={linkStyle}>Câu hỏi thường gặp</Link></li>
          </ul>
        </div>

        {/* Cột 4: Liên hệ */}
        <div style={columnStyle}>
          <h4 style={titleStyle}>Kết nối với chúng tôi</h4>
          <p style={textStyle}>📞 Hotline: 1900 1234</p>
          <p style={textStyle}>📧 Email: support@cinemabooking.vn</p>
          <p style={textStyle}>📍 Địa chỉ: Phường Tân Thịnh, TP. Thái Nguyên</p>
        </div>
      </div>

      {/* Dòng bản quyền dưới cùng */}
      <div style={bottomBar}>
        <p style={{ margin: 0 }}>
          &copy; {new Date().getFullYear()} CinemaBooking. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

const footerWrapper = {
  backgroundColor: "#0f172a", // Màu xanh đen đậm, hợp với web phim
  color: "#e2e8f0",
  paddingTop: "40px",
  marginTop: "auto", // Đẩy footer xuống cuối trang nếu nội dung ngắn
  borderTop: "3px solid #1890ff", // Đường viền xanh tạo điểm nhấn
};

const footerContainer = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "0 20px",
  display: "flex",
  flexWrap: "wrap", // Tự động rớt dòng khi màn hình nhỏ (Mobile)
  justifyContent: "space-between",
  gap: "30px",
};

const columnStyle = {
  flex: "1 1 200px", // Chiếm không gian đều nhau, tối thiểu 200px
  marginBottom: "20px",
};

const brandStyle = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 15px 0",
};

const titleStyle = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 15px 0",
  textTransform: "uppercase",
};

const textStyle = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#94a3b8",
  marginBottom: "10px",
};

const listStyle = {
  listStyleType: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const linkStyle = {
  color: "#94a3b8",
  textDecoration: "none",
  fontSize: "14px",
  transition: "color 0.3s ease",
};

const bottomBar = {
  backgroundColor: "#020617",
  textAlign: "center",
  padding: "15px 0",
  marginTop: "30px",
  fontSize: "14px",
  color: "#64748b",
};