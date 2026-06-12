import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
export default function AddMovie() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImg, setPreviewImg] = useState("");

  const [movie, setMovie] = useState({
    id: null,
    title: "",
    description: "",
    duration: "",
    genre: "",
    director: "",
    trailerUrl: "",
    posterUrl: "", // Nhớ phải có trường này nhé
    status: "COMING_SOON",
  });

  const fetchMovies = () => {
    fetch(`${API_BASE}/api/movies`)
      .then((res) => res.json())
      .then((data) => setMovies(data))
      .catch((err) => console.error("Lỗi tải danh sách phim:", err));
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === "duration") {
      value = value ? Number(value) : "";
    }
    setMovie({ ...movie, [e.target.name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImg(URL.createObjectURL(file));
    }
  };

  // 🎯 Đã thêm "async" vào đây và dọn dẹp phần code cũ bị dư
  const handleSubmit = async () => {
    if (!movie.title.trim()) {
      alert("❌ Vui lòng nhập tên phim!");
      return;
    }

    setLoading(true);
    let finalPosterUrl = movie.posterUrl;

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Lỗi khi upload ảnh!");
        finalPosterUrl = await uploadRes.text();
      }

      const payload = { ...movie, posterUrl: finalPosterUrl };

      const isEditing = movie.id !== null;
      const url = isEditing
        ? `${API_BASE}/api/movies/${movie.id}`
        : `${API_BASE}/api/movies`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Lỗi khi lưu phim!");

      alert(
        isEditing ? "✅ Cập nhật phim thành công!" : "✅ Thêm phim thành công!",
      );

      setMovie({
        id: null,
        title: "",
        description: "",
        duration: "",
        genre: "",
        director: "",
        trailerUrl: "",
        posterUrl: "",
        status: "COMING_SOON",
      });
      setSelectedFile(null);
      setPreviewImg("");
      fetchMovies();
    } catch (err) {
      alert("❌ Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (m) => {
    setMovie({
      id: m.id,
      title: m.title,
      description: m.description,
      duration: m.duration,
      genre: m.genre,
      director: m.director || "",
      trailerUrl: m.trailerUrl,
      posterUrl: m.posterUrl || "",
      status: m.status,
    });
    setPreviewImg(""); // Reset ảnh xem trước khi bấm sửa
    setSelectedFile(null);
    window.scrollTo(0, 0);
  };

  const handleDelete = (id) => {
    if (window.confirm("⚠️ Bạn có chắc chắn muốn xóa bộ phim này không?")) {
      fetch(`${API_BASE}/api/movies/${id}`, { method: "DELETE" })
        .then(() => {
          alert("✅ Đã xóa phim thành công!");
          fetchMovies();
        })
        .catch((err) => alert("❌ Lỗi khi xóa: " + err.message));
    }
  };

  return (
    <div style={container}>
      <div style={card}>
        <h2 style={{ textAlign: "left", marginBottom: "20px", color: "#333" }}>
          {movie.id ? "✏️ Cập nhật Phim" : "🎬 Thêm Phim Mới"}
        </h2>

        <input
          name="title"
          placeholder="Tên phim"
          value={movie.title}
          onChange={handleChange}
          style={input}
        />

        {/* 🎯 ĐÃ THÊM LẠI KHU VỰC CHỌN ẢNH BỊ THIẾU Ở ĐÂY */}
        <div style={{ marginBottom: "15px", width: "100%" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              color: "#333",
              textAlign: "left",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            Ảnh Poster Phim:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{
              ...input,
              padding: "8px",
              background: "#f9f9f9",
              cursor: "pointer",
            }}
          />
        </div>

        {/* 🖼️ KHU VỰC XEM TRƯỚC ẢNH */}
        {(previewImg || movie.posterUrl) && (
          <div style={{ marginBottom: "15px", textAlign: "left" }}>
            <img
              src={previewImg || movie.posterUrl}
              alt="Xem trước"
              style={{
                height: "150px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                objectFit: "cover",
              }}
            />
          </div>
        )}

        <input
          name="description"
          placeholder="Mô tả"
          value={movie.description}
          onChange={handleChange}
          style={input}
        />
        <input
          name="duration"
          type="number"
          placeholder="Thời lượng (phút)"
          value={movie.duration}
          onChange={handleChange}
          style={input}
        />
        <input
          name="genre"
          placeholder="Thể loại"
          value={movie.genre}
          onChange={handleChange}
          style={input}
        />
        <input
          name="director"
          placeholder="Đạo diễn"
          value={movie.director}
          onChange={handleChange}
          style={input}
        />
        <input
          name="trailerUrl"
          placeholder="Link Trailer (Ví dụ: youtube.com/...)"
          value={movie.trailerUrl}
          onChange={handleChange}
          style={input}
        />

        <select
          name="status"
          value={movie.status}
          onChange={handleChange}
          style={input}
        >
          <option value="NOW_SHOWING">Đang chiếu</option>
          <option value="COMING_SOON">Sắp chiếu</option>
          <option value="STOPPED">Dừng chiếu</option>
        </select>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleSubmit} style={button} disabled={loading}>
            {loading
              ? "Đang xử lý..."
              : movie.id
                ? "Lưu Thay Đổi"
                : "Thêm Phim"}
          </button>

          {movie.id && (
            <button
              onClick={() => {
                setMovie({
                  id: null,
                  title: "",
                  description: "",
                  duration: "",
                  genre: "",
                  director: "",
                  trailerUrl: "",
                  posterUrl: "",
                  status: "COMING_SOON",
                });
                setSelectedFile(null);
                setPreviewImg("");
              }}
              style={cancelButton}
            >
              Hủy
            </button>
          )}
        </div>
      </div>

      <div style={tableCard}>
        <h3 style={{ textAlign: "left", marginBottom: "15px", color: "#333" }}>
          📋 Danh sách Phim
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
              <th style={th}>Tên phim</th>
              <th style={th}>Thời lượng</th>
              <th style={th}>Thể loại</th>
              <th style={th}>Đạo diễn</th>
              <th style={th}>Trạng thái</th>
              <th style={thRight}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((m) => (
              <tr key={m.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={td}>
                  <b>{m.title}</b>
                </td>
                <td style={td}>{m.duration} phút</td>
                <td style={td}>{m.genre}</td>
                <td style={td}>{m.director || "Không rõ"}</td>
                <td style={td}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      backgroundColor:
                        m.status === "NOW_SHOWING"
                          ? "#e6f7ff"
                          : m.status === "STOPPED"
                            ? "#f3f4f6"
                            : "#fffb8f",
                      color:
                        m.status === "NOW_SHOWING"
                          ? "#1890ff"
                          : m.status === "STOPPED"
                            ? "#6b7280"
                            : "#d48806",
                      border: `1px solid ${
                        m.status === "NOW_SHOWING"
                          ? "#91d5ff"
                          : m.status === "STOPPED"
                            ? "#d1d5db"
                            : "#ffe58f"
                      }`,
                    }}
                  >
                    {m.status === "NOW_SHOWING"
                      ? "Đang chiếu"
                      : m.status === "STOPPED"
                        ? "Dừng chiếu"
                        : "Sắp chiếu"}
                  </span>
                </td>
                <td style={tdRight}>
                  <button onClick={() => handleEdit(m)} style={editBtn}>
                    Sửa
                  </button>
                  <button onClick={() => handleDelete(m.id)} style={deleteBtn}>
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {movies.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  Chưa có phim nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 🎨 STYLE
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
