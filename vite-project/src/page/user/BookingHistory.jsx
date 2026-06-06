import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CinemaHeader from "../CinemaHeader";

const HOLD_SECONDS = 10 * 60;

export default function BookingHistory() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const userId = Number(user?.id ?? user?.Id ?? 0);

  useEffect(() => {
    if (!userId) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    fetch(`/api/bookings/history?userId=${userId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        return res.json();
      })
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Lỗi tải lịch sử đặt vé:", err);
        alert("Không tải được lịch sử đặt vé: " + err.message);
      })
      .finally(() => setLoading(false));
  }, [navigate, userId]);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getRemainingSeconds = (createdAt) => {
    if (!createdAt) {
      return 0;
    }

    const createdTs = new Date(createdAt).getTime();
    if (!Number.isFinite(createdTs)) {
      return 0;
    }

    const elapsedSeconds = Math.floor((nowTs - createdTs) / 1000);
    return Math.max(0, HOLD_SECONDS - elapsedSeconds);
  };

  const formatDuration = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div style={container}>
      <CinemaHeader
        cinemaName="Lịch sử đặt vé"
        hideBackButton={false}
        showMovieTabs={false}
      />

      <div style={contentWrap}>
        <div style={card}>
          <h2 style={{ marginTop: 0 }}>Đơn đã đặt của bạn</h2>

          <div className="responsive-table-wrapper" style={{ overflowX: "auto" }}>
            <table className="responsive-table" style={table}>
              <thead>
                <tr>
                  <th style={th}>Mã đơn</th>
                  <th style={th}>Rạp</th>
                  <th style={th}>Phim</th>
                  <th style={th}>Suất chiếu</th>
                  <th style={th}>Ghế</th>
                  <th style={th}>Số ghế</th>
                  <th style={th}>Tổng tiền</th>
                  <th style={th}>Trạng thái</th>
                  <th style={th}>Tạo lúc</th>
                  <th style={th}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td style={tdCenter} colSpan={10}>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                )}

                {!loading && bookings.length === 0 && (
                  <tr>
                    <td style={tdCenter} colSpan={10}>
                      Bạn chưa có đơn đặt vé nào.
                    </td>
                  </tr>
                )}

                {!loading &&
                  bookings.map((b) => {
                    const status = String(b.status || "").toUpperCase();
                    const remaining = getRemainingSeconds(b.createdAt);
                    const canContinue = status === "PENDING" && remaining > 0;

                    return (
                      <tr key={b.id}>
                        <td style={td}>{b.id}</td>
                        <td style={td}>{b.cinemaName || "Không rõ"}</td>
                        <td style={td}>{b.movieTitle || "Không rõ"}</td>
                        <td style={td}>
                          {b.startTime
                            ? new Date(b.startTime).toLocaleString("vi-VN")
                            : "Không rõ"}
                        </td>
                        <td style={td}>{b.seatLabels || "Không rõ"}</td>
                        <td style={td}>{b.seatCount ?? 0}</td>
                        <td style={td}>
                          {Number(b.totalPrice || 0).toLocaleString("vi-VN")}{" "}
                          VND
                        </td>
                        <td style={td}>
                          {status}
                          {canContinue && ` (${formatDuration(remaining)})`}
                        </td>
                        <td style={td}>
                          {b.createdAt
                            ? new Date(b.createdAt).toLocaleString("vi-VN")
                            : "Không rõ"}
                        </td>
                        <td style={td}>
                          {canContinue ? (
                            <button
                              style={continueBtn}
                              onClick={() =>
                                navigate(`/payment?bookingId=${b.id}`)
                              }
                            >
                              Tiếp tục thanh toán
                            </button>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const container = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0b1220, #111827)",
};

const contentWrap = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "24px 16px",
};

const card = {
  background: "#fff",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
};

const table = { width: "100%", borderCollapse: "collapse", minWidth: 0 };
const th = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "2px solid #e5e7eb",
  background: "#f1f5f9",
};
const td = { padding: "10px 8px", borderBottom: "1px solid #e5e7eb" };
const tdCenter = { ...td, textAlign: "center" };
const continueBtn = {
  border: "none",
  borderRadius: 8,
  padding: "8px 10px",
  background: "#0c4a6e",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};
