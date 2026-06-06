import { useEffect, useMemo, useState } from "react";

export default function AdminBookingReport() {
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  useEffect(() => {
    fetch("/api/cinemas")
      .then((res) => res.json())
      .then((data) => setCinemas(data || []))
      .catch((err) => console.error("Lỗi tải rạp:", err));
  }, []);

  useEffect(() => {
    if (!selectedCinemaId) {
      setBookings([]);
      return;
    }

    setLoading(true);
    fetch(
      `/api/admin/bookings?cinemaId=${selectedCinemaId}`,
    )
      .then((res) => res.json())
      .then((data) => setBookings(data || []))
      .catch((err) => console.error("Lỗi tải đơn đặt vé:", err))
      .finally(() => setLoading(false));
  }, [selectedCinemaId]);

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá đơn này không?")) {
      return;
    }

    setDeleteLoadingId(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(`Xoá đơn thất bại: ${res.status}`);
      }
      setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
    } catch (err) {
      console.error(err);
      alert("Xoá đơn không thành công. Vui lòng thử lại.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const stats = useMemo(() => {
    const paidBookings = bookings.filter((b) => String(b.status) === "PAID");
    const total = paidBookings.reduce(
      (sum, b) => sum + Number(b.totalPrice || 0),
      0,
    );
    const paidCount = paidBookings.length;
    return {
      count: bookings.length,
      paidCount,
      revenue: total,
    };
  }, [bookings]);

  return (
    <div style={container}>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Thống kê đặt vé theo rạp</h2>

        <label style={{ fontWeight: "bold" }}>Chọn rạp</label>
        <select
          style={input}
          value={selectedCinemaId}
          onChange={(e) => setSelectedCinemaId(e.target.value)}
        >
          <option value="">-- Chọn rạp --</option>
          {cinemas.map((c) => {
            const id = c.id ?? c.Id;
            const name = c.name ?? c.Name;
            return (
              <option key={id} value={id}>
                {name}
              </option>
            );
          })}
        </select>

        <div style={statGrid}>
          <div style={statBox}>
            <div style={statLabel}>Tổng đơn</div>
            <div style={statValue}>{stats.count}</div>
          </div>
          <div style={statBox}>
            <div style={statLabel}>Đơn đã thanh toán</div>
            <div style={statValue}>{stats.paidCount}</div>
          </div>
          <div style={statBox}>
            <div style={statLabel}>Doanh thu</div>
            <div style={statValue}>
              {stats.revenue.toLocaleString("vi-VN")} VND
            </div>
          </div>
        </div>

        <div className="responsive-table-wrapper" style={{ overflowX: "auto", maxHeight: "400px", overflowY: "auto" }}>
          <table className="responsive-table" style={table}>
            <thead>
              <tr>
                <th style={th}>Mã đơn</th>
                <th style={th}>Người dùng</th>
                <th style={{ ...th, textAlign: "left", paddingLeft: 12, minWidth: 180, maxWidth: 320, whiteSpace: "normal", wordBreak: "break-word" }}>Phim</th>
                <th style={th}>Suất chiếu</th>
                <th style={th}>Ghế đã đặt</th>
                <th style={th}>Số ghế</th>
                <th style={th}>Loại ghế</th>
                <th style={th}>Tổng tiền</th>
                <th style={th}>Trạng thái</th>
                <th style={th}>Tạo lúc</th>
                <th style={th}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} style={tdCenter}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              )}

              {!loading && bookings.length === 0 && (
                <tr>
                  <td colSpan={10} style={tdCenter}>
                    Không có đơn nào
                  </td>
                </tr>
              )}

              {!loading &&
                bookings.map((b) => (
                  <tr key={b.id}>
                    <td style={td}>{b.id}</td>
                    <td style={td}>{b.username}</td>
                    <td style={{ ...td, textAlign: "left", paddingLeft: 12, minWidth: 180, maxWidth: 320, whiteSpace: "normal", wordBreak: "break-word" }}>{b.movieTitle}</td>
                     <td style={{ ...td, textAlign: "left", paddingLeft: 12 }}>
                      {b.startTime
                        ? new Date(b.startTime).toLocaleString("vi-VN")
                        : "Không rõ"}
                    </td>
                    <td style={td}>{b.seatLabels || "Không rõ"}</td>
                    <td style={td}>{b.seatCount}</td>
                    <td style={td}>{b.seatTypes || "Không rõ"}</td>
                    <td style={td}>
                      {Number(b.totalPrice || 0).toLocaleString("vi-VN")} VND
                    </td>
                    <td style={td}>{b.status}</td>
                    <td style={td}>
                      {b.createdAt
                        ? new Date(b.createdAt).toLocaleString("vi-VN")
                        : "Không rõ"}
                    </td>
                    <td style={td}>
                      {(b.status === "PENDING" || b.status === "CANCELLED") ? (
                        <button
                          style={deleteBtn}
                          onClick={() => handleDeleteBooking(b.id)}
                          disabled={deleteLoadingId === b.id}
                        >
                          {deleteLoadingId === b.id ? "Đang xoá..." : "Xoá"}
                        </button>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>Không</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const container = {
  minHeight: "100vh",
  padding: "20px 10px",
  background: "linear-gradient(120deg, #0f172a, #1e293b)",
  fontFamily: "Arial, sans-serif",
};

const card = {
  maxWidth: 1100,
  margin: "0 auto",
  background: "white",
  borderRadius: 12,
  padding: 24,
};

const input = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #d1d5db",
  marginTop: 8,
  marginBottom: 16,
};

const statGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginBottom: 16,
};

const statBox = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 12,
  background: "#f8fafc",
};
const statLabel = {
  fontSize: 12,
  color: "#64748b",
  marginBottom: 8,
  textTransform: "uppercase",
};
const statValue = { fontSize: 18, fontWeight: "bold", color: "#0f172a" };

const table = { width: "100%", borderCollapse: "collapse", minWidth: 0 };
const th = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "2px solid #e5e7eb",
  background: "#f1f5f9",
};
const td = { padding: "10px 8px", borderBottom: "1px solid #e5e7eb" };
const tdCenter = { ...td, textAlign: "center" };
const deleteBtn = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "none",
  background: "#ef4444",
  color: "white",
  fontWeight: "600",
  cursor: "pointer",
};
