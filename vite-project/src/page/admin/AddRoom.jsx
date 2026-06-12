import { useState, useEffect } from "react";
const API_BASE = import.meta.env.VITE_API_BASE_URL;
export default function AddRoom() {
  const [rooms, setRooms] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    cinemaId: "",
    name: "",
  });

  // 1. Tải danh sách Rạp và Phòng khi vừa vào trang
  const fetchData = () => {
    // Lấy danh sách Rạp (để cho vào thẻ select)
    fetch(`${API_BASE}/api/cinemas`)
      .then((res) => res.json())
      .then((data) => setCinemas(data))
      .catch((err) => console.error("Lỗi tải rạp:", err));

    // Lấy danh sách Phòng (để hiển thị ra bảng)
    fetch(`${API_BASE}/api/rooms`)
      .then((res) => res.json())
      .then((data) => setRooms(data))
      .catch((err) => console.error("Lỗi tải phòng:", err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 2. Xử lý THÊM MỚI hoặc CẬP NHẬT
  const handleSubmit = () => {
    if (!formData.cinemaId || !formData.name.trim()) {
      alert("❌ Vui lòng chọn Rạp và nhập Tên phòng!");
      return;
    }

    setLoading(true);

    const isEditing = formData.id !== null;
    const url = isEditing
      ? `${API_BASE}/api/rooms/${formData.id}`
      : `${API_BASE}/api/rooms`;
    const method = isEditing ? "PUT" : "POST";

    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cinemaId: Number(formData.cinemaId),
        name: formData.name,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(() => {
        alert(
          isEditing
            ? "✅ Cập nhật phòng thành công!"
            : "✅ Thêm phòng thành công!",
        );
        setFormData({ id: null, cinemaId: "", name: "" }); // Reset form
        fetchData(); // Load lại bảng
      })
      .catch((err) => alert("❌ Lỗi: " + err.message))
      .finally(() => setLoading(false));
  };

  // 3. Xử lý khi bấm SỬA
  const handleEdit = (room) => {
    setFormData({
      id: room.id,
      cinemaId: room.cinemaId,
      name: room.name,
    });
    window.scrollTo(0, 0);
  };

  // 4. Xử lý khi bấm XÓA
  const handleDelete = (id) => {
    if (
      window.confirm(
        "⚠️ Xóa phòng chiếu sẽ tự động XÓA TOÀN BỘ GHẾ và SUẤT CHIẾU thuộc phòng này. Bạn chắc chắn chứ?",
      )
    ) {
     fetch(`${API_BASE}/api/rooms/${id}`, { method: "DELETE" })
        .then(() => {
          alert("✅ Đã xóa phòng chiếu!");
          fetchData();
        })
        .catch((err) => alert("❌ Lỗi khi xóa: " + err.message));
    }
  };
  // Hàm hỗ trợ: Lấy tên Rạp từ ID
  const getCinemaName = (cinemaId) => {
    const cinema = cinemas.find((c) => c.id === cinemaId);
    return cinema ? cinema.name : "Không rõ";
  };

  return (
    <div style={container}>
      {/* 📌 KHU VỰC FORM */}
      <div style={card}>
        <h2 style={{ textAlign: "left", marginBottom: "20px", color: "#333" }}>
          {formData.id ? "✏️ Cập nhật Phòng" : "🚪 Thêm Phòng Chiếu"}
        </h2>

        <select
          name="cinemaId"
          value={formData.cinemaId}
          onChange={handleChange}
          style={input}
        >
          <option value="">-- Chọn Rạp Chiếu --</option>
          {cinemas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="name"
          placeholder="Tên phòng (VD: Phòng 1 - 2D, RAP IMAX...)"
          value={formData.name}
          onChange={handleChange}
          style={input}
        />

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleSubmit} style={button} disabled={loading}>
            {loading
              ? "Đang xử lý..."
              : formData.id
                ? "Lưu Thay Đổi"
                : "Thêm Phòng"}
          </button>

          {formData.id && (
            <button
              onClick={() => setFormData({ id: null, cinemaId: "", name: "" })}
              style={cancelButton}
            >
              Hủy
            </button>
          )}
        </div>
      </div>

      {/* 📌 KHU VỰC BẢNG DANH SÁCH */}
      <div style={tableCard}>
        <h3 style={{ textAlign: "left", marginBottom: "15px", color: "#333" }}>
          📋 Danh sách Phòng chiếu
        </h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f0f2f5" }}>
              <th style={th}>ID</th>
              <th style={th}>Thuộc Rạp</th>
              <th style={th}>Tên Phòng</th>
              <th style={thRight}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={td}>{r.id}</td>
                <td style={td}>
                  <b>{getCinemaName(r.cinemaId)}</b>
                </td>
                <td style={td}>{r.name}</td>
                <td style={tdRight}>
                  <button onClick={() => handleEdit(r)} style={editBtn}>
                    Sửa
                  </button>
                  <button onClick={() => handleDelete(r.id)} style={deleteBtn}>
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  Chưa có phòng chiếu nào
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
  width: "600px",
  padding: "30px",
  background: "white",
  borderRadius: "12px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
};
const tableCard = { ...card, marginTop: "30px", width: "700px", maxHeight: "400px", overflowY: "auto" };
const input = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "15px",
  boxSizing: "border-box",
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

const th = {
  padding: "12px 15px",
  borderBottom: "2px solid #ddd",
  textAlign: "left",
};
const thRight = { ...th, textAlign: "right" };
const td = { padding: "12px 15px", textAlign: "left", verticalAlign: "middle" };
const tdRight = { ...td, textAlign: "right" };
const seatBtn = {
  padding: "6px 12px",
  background: "#52c41a",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  marginRight: "8px",
  fontWeight: "bold",
};
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
