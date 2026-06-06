import { useEffect, useState } from "react";

export default function AddShowtime() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [allRooms, setAllRooms] = useState([]); // Chứa tất cả phòng để hiển thị bảng
  const [filteredRooms, setFilteredRooms] = useState([]); // Phòng xổ ra theo rạp trong form
  const [loading, setLoading] = useState(false);
  const [filterCinemaId, setFilterCinemaId] = useState("");
  const [filterRoomId, setFilterRoomId] = useState("");

  const [formData, setFormData] = useState({
    id: null,
    movieId: "",
    cinemaId: "",
    roomId: "",
    startTime: "",
    basePrice: "",
  });

  // 1. Tải toàn bộ dữ liệu ban đầu
  useEffect(() => {
    fetchShowtimes();

    fetch("/api/movies")
      .then((res) => res.json())
      .then((data) => setMovies(data));

    fetch("/api/cinemas")
      .then((res) => res.json())
      .then((data) => setCinemas(data));

    // Lấy tất cả phòng để map tên phòng ra bảng
    fetch("/api/rooms")
      .then((res) => res.json())
      .then((data) => setAllRooms(data));
  }, []);

  // Lấy danh sách suất chiếu
  const fetchShowtimes = () => {
    fetch("/api/showtimes")
      .then((res) => res.json())
      .then((data) => setShowtimes(data))
      .catch((err) => console.error("Lỗi tải suất chiếu:", err));
  };

  // 2. Tự động load Phòng khi Rạp (cinemaId) thay đổi
  useEffect(() => {
    if (!formData.cinemaId) {
      setFilteredRooms([]);
      return;
    }
    fetch(`/api/rooms/cinema/${formData.cinemaId}`)
      .then((res) => res.json())
      .then((data) => setFilteredRooms(data));
  }, [formData.cinemaId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFilterCinemaChange = (e) => {
    const value = e.target.value;
    setFilterCinemaId(value);
    setFilterRoomId("");
  };

  const handleFilterRoomChange = (e) => {
    setFilterRoomId(e.target.value);
  };

  const toLocalDateTimeString = (date) => {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds(),
    )}`;
  };

  const toLocalInputValue = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (val) => String(val).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // 3. Xử lý THÊM MỚI hoặc LƯU THAY ĐỔI
  const handleSubmit = () => {
    if (
      !formData.movieId ||
      !formData.roomId ||
      !formData.startTime ||
      !formData.basePrice
    ) {
      alert("❌ Vui lòng điền đủ thông tin!");
      return;
    }

    setLoading(true);

    // Tính toán thời gian kết thúc (EndTime)
    const selectedMovie = movies.find((m) => m.id === Number(formData.movieId));
    const durationMinutes = selectedMovie ? selectedMovie.duration : 120;
    const startDate = new Date(formData.startTime);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    const payload = {
      movieId: Number(formData.movieId),
      roomId: Number(formData.roomId),
      startTime: toLocalDateTimeString(startDate),
      endTime: toLocalDateTimeString(endDate),
      basePrice: Number(formData.basePrice),
    };

    const isEditing = formData.id !== null;
    const url = isEditing
      ? `/api/showtimes/${formData.id}`
      : "/api/showtimes";
    const method = isEditing ? "PUT" : "POST";

    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(() => {
        alert(
          isEditing
            ? "✅ Cập nhật thành công!"
            : "✅ Thêm suất chiếu thành công!",
        );
        setFormData({
          id: null,
          movieId: "",
          cinemaId: "",
          roomId: "",
          startTime: "",
          basePrice: "",
        });
        fetchShowtimes();
      })
      .catch((err) => alert("❌ Lỗi: " + err.message))
      .finally(() => setLoading(false));
  };

  // 4. Xử lý khi bấm nút SỬA
  const handleEdit = (st) => {
    // Tìm rạp chiếu tương ứng với phòng này để gán vào form
    const room = allRooms.find((r) => r.id === st.roomId);

    setFormData({
      id: st.id,
      movieId: st.movieId,
      cinemaId: room ? room.cinemaId : "",
      roomId: st.roomId,
      startTime: toLocalInputValue(st.startTime),
      basePrice: st.basePrice,
    });
    window.scrollTo(0, 0);
  };

  // 5. Xử lý khi bấm nút XÓA
  const handleDelete = (id) => {
    if (window.confirm("⚠️ Bạn có chắc chắn muốn xóa suất chiếu này không?")) {
      fetch(`/api/showtimes/${id}`, { method: "DELETE" })
        .then(() => {
          alert("✅ Đã xóa thành công!");
          fetchShowtimes();
        })
        .catch((err) => alert("❌ Lỗi khi xóa: " + err.message));
    }
  };

  // Hàm hỗ trợ render tên Phim và Phòng cho bảng
  const getMovieName = (id) => movies.find((m) => m.id === id)?.title || "Không rõ";
  const getRoomName = (id) => allRooms.find((r) => r.id === id)?.name || "Không rõ";
  const getCinemaNameByRoom = (roomId) => {
    const room = allRooms.find((r) => r.id === roomId);
    return cinemas.find((c) => c.id === room?.cinemaId)?.name || "Không rõ";
  };
  const getCinemaIdByRoom = (roomId) =>
    allRooms.find((r) => r.id === roomId)?.cinemaId || null;

  const filteredShowtimes = showtimes.filter((st) => {
    const roomCinemaId = getCinemaIdByRoom(st.roomId);
    if (filterCinemaId && Number(filterCinemaId) !== roomCinemaId) return false;
    if (filterRoomId && Number(filterRoomId) !== st.roomId) return false;
    return true;
  });

  const roomsForFilter = filterCinemaId
    ? allRooms.filter((r) => r.cinemaId === Number(filterCinemaId))
    : allRooms;

  return (
    <div style={container}>
      {/* 📌 FORM THÊM/SỬA */}
      <div style={card}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          {formData.id ? "✏️ Cập nhật Suất Chiếu" : "📅 Tạo Suất Chiếu"}
        </h2>

        <select
          name="movieId"
          value={formData.movieId}
          onChange={handleChange}
          style={input}
        >
          <option value="">-- Chọn Phim --</option>
          {movies.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>

        <select
          name="cinemaId"
          value={formData.cinemaId}
          onChange={handleChange}
          style={input}
        >
          <option value="">-- Chọn Rạp --</option>
          {cinemas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          name="roomId"
          value={formData.roomId}
          onChange={handleChange}
          style={input}
          disabled={!formData.cinemaId}
        >
          <option value="">
            {formData.cinemaId ? "-- Chọn Phòng --" : "Vui lòng chọn rạp trước"}
          </option>
          {filteredRooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <input
          type="datetime-local"
          name="startTime"
          value={formData.startTime}
          onChange={handleChange}
          style={input}
        />
        <input
          type="number"
          name="basePrice"
          placeholder="Giá vé gốc (VNĐ)"
          value={formData.basePrice}
          onChange={handleChange}
          style={input}
        />

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleSubmit} style={button} disabled={loading}>
            {loading
              ? "Đang xử lý..."
              : formData.id
                ? "Lưu Thay Đổi"
                : "Thêm Suất Chiếu"}
          </button>

          {formData.id && (
            <button
              onClick={() =>
                setFormData({
                  id: null,
                  movieId: "",
                  cinemaId: "",
                  roomId: "",
                  startTime: "",
                  basePrice: "",
                })
              }
              style={cancelButton}
            >
              Hủy
            </button>
          )}
        </div>
      </div>

      {/* 📌 BẢNG DANH SÁCH SUẤT CHIẾU */}
      <div style={tableCard}>
        <h3 style={{ marginBottom: "15px" }}>📋 Danh sách Suất chiếu</h3>
        <div style={filterRow}>
          <select
            name="filterCinemaId"
            value={filterCinemaId}
            onChange={handleFilterCinemaChange}
            style={filterInput}
          >
            <option value="">-- Lọc theo Rạp --</option>
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            name="filterRoomId"
            value={filterRoomId}
            onChange={handleFilterRoomChange}
            style={filterInput}
            disabled={roomsForFilter.length === 0}
          >
            <option value="">-- Lọc theo Phòng --</option>
            {roomsForFilter.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f0f2f5", textAlign: "left" }}>
              <th style={th}>Phim</th>
              <th style={th}>Rạp</th>
              <th style={th}>Phòng</th>
              <th style={th}>Giờ chiếu</th>
              <th style={th}>Giá vé</th>
              <th style={th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredShowtimes.map((st) => (
              <tr key={st.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={td}>
                  <b>{getMovieName(st.movieId)}</b>
                </td>
                <td style={td}>{getCinemaNameByRoom(st.roomId)}</td>
                <td style={td}>{getRoomName(st.roomId)}</td>
                <td style={td}>
                  {new Date(st.startTime).toLocaleString("vi-VN")}
                </td>
                <td style={td}>{st.basePrice.toLocaleString()}đ</td>
                <td style={td}>
                  <button onClick={() => handleEdit(st)} style={editBtn}>
                    Sửa
                  </button>
                  <button onClick={() => handleDelete(st.id)} style={deleteBtn}>
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {filteredShowtimes.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  Chưa có suất chiếu nào
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

const tableCard = {
  ...card,
  marginTop: "30px",
  width: "700px",
  maxHeight: "400px",
  overflowY: "auto"
};

const input = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "15px",
  boxSizing: "border-box",
};

const filterRow = {
  display: "flex",
  gap: "12px",
  marginBottom: "15px",
};

const filterInput = {
  flex: 1,
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
  boxSizing: "border-box",
};

const button = {
  width: "100%",
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

const td = {
  padding: "12px 15px",
  textAlign: "left",
  verticalAlign: "middle",
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
