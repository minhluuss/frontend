import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
export default function AddCinema() {
  const [cinemas, setCinemas] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);

  // 1. Lấy danh sách rạp khi vừa vào trang
  const fetchCinemas = () => {
    fetch(`${API_BASE}/api/cinemas`)
      .then((res) => res.json())
      .then((data) => setCinemas(data))
      .catch((err) => console.error("Lỗi tải danh sách rạp:", err));
  };

  useEffect(() => {
    fetchCinemas();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Hàm THÊM MỚI hoặc CẬP NHẬT (Lưu chung 1 nút)
  const handleSubmit = () => {
    if (!formData.name || !formData.location) {
      alert("❌ Vui lòng nhập đầy đủ Tên rạp và Địa chỉ!");
      return;
    }

    setLoading(true);

    const isEditing = formData.id !== null;
    const url = isEditing
      ? `${API_BASE}/api/cinemas/${formData.id}`
      : `${API_BASE}/api/cinemas`;

    const method = isEditing ? "PUT" : "POST";

    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        location: formData.location,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(() => {
        alert(
          isEditing ? "✅ Cập nhật thành công!" : "✅ Thêm rạp thành công!",
        );
        setFormData({ id: null, name: "", location: "" }); // Reset form
        fetchCinemas(); // Load lại bảng
      })
      .catch((err) => alert("❌ Lỗi: " + err.message))
      .finally(() => setLoading(false));
  };

  // 3. Hàm bấm nút SỬA (Đưa dữ liệu lên form)
  const handleEdit = (cinema) => {
    setFormData({
      id: cinema.id,
      name: cinema.name,
      location: cinema.location,
    });
    window.scrollTo(0, 0); // Cuộn lên đầu trang
  };

  // 4. Hàm bấm nút XÓA
  const handleDelete = (id) => {
    if (window.confirm("⚠️ Bạn có chắc chắn muốn xóa rạp này không?")) {
      fetch(`${API_BASE}/api/cinemas/${id}`, { method: "DELETE" })
        .then(() => {
          alert("✅ Đã xóa thành công!");
          fetchCinemas(); // Load lại bảng
        })
        .catch((err) => alert("❌ Lỗi khi xóa: " + err.message));
    }
  };

  return (
    <div style={container}>
      {/* 📌 KHU VỰC FORM THÊM/SỬA */}
      <div style={card}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          {formData.id ? "✏️ Cập nhật Rạp Chiếu" : "🏢 Thêm Rạp Chiếu"}
        </h2>

        <input
          type="text"
          name="name"
          placeholder="Tên rạp (VD: Beta Thái Nguyên)"
          value={formData.name}
          onChange={handleChange}
          style={input}
        />
        <input
          type="text"
          name="location"
          placeholder="Địa chỉ rạp"
          value={formData.location}
          onChange={handleChange}
          style={input}
        />

        <div style={{ display: "flex", gap: "10px" }}>
          {/* Nút chính: Thêm/Lưu */}
          <button onClick={handleSubmit} style={button} disabled={loading}>
            {loading
              ? "Đang xử lý..."
              : formData.id
                ? "Lưu Thay Đổi"
                : "Thêm Rạp Mới"}
          </button>

          {/* Nút Hủy hiển thị khi đang sửa */}
          {formData.id && (
            <button
              onClick={() => setFormData({ id: null, name: "", location: "" })}
              style={cancelButton}
            >
              Hủy
            </button>
          )}
        </div>
      </div>

      {/* 📌 KHU VỰC BẢNG DANH SÁCH */}
      {/* 💡 Chú ý style mở rộng tableCard cho cái bảng 👇 */}
      <div style={tableCard}>
        <h3 style={{ marginBottom: "15px" }}>📋 Danh sách Rạp phim</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f2f5", textAlign: "left" }}>
              <th style={th}>ID</th>
              <th style={th}>Tên rạp</th>
              <th style={th}>Địa chỉ</th>
              <th style={th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {cinemas.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={td}>{c.id}</td>
                <td style={td}>
                  <b>{c.name}</b>
                </td>
                <td style={td}>{c.location}</td>
                <td style={td}>
                  <button onClick={() => handleEdit(c)} style={editBtn}>
                    Sửa
                  </button>
                  <button onClick={() => handleDelete(c.id)} style={deleteBtn}>
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {cinemas.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  Chưa có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const container = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  paddingTop: "50px",
  paddingBottom: "50px",
  minHeight: "100vh",
  background: "linear-gradient(to right, #141e30, #243b55)",
};

const card = {
  width: "450px",
  padding: "30px",
  background: "white",
  borderRadius: "12px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.05)",
};
const tableCard = { ...card, marginTop: "30px", width: "700px", maxHeight: "400px", overflowY: "auto" };
const input = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "15px",
};
const button = {
  flex: 1,
  padding: "12px",
  background: "#1890ff",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "16px",
};
const cancelButton = {
  flex: 1,
  padding: "12px",
  background: "#d9d9d9",
  color: "black",
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
};
const th = { padding: "12px", borderBottom: "2px solid #ddd" };
const td = { padding: "12px" };
const editBtn = {
  padding: "6px 12px",
  background: "#faad14",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  marginRight: "8px",
};
const deleteBtn = {
  padding: "6px 12px",
  background: "#ff4d4f",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};
