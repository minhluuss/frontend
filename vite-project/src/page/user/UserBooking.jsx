import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_BASE_URL;
export default function UserBooking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const cinemaId = Number(searchParams.get("cinemaId"));
  const movieId = Number(searchParams.get("movieId"));

  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState("");
  const [seats, setSeats] = useState([]);
  const [bookedSeatIds, setBookedSeatIds] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const getId = (obj) => Number(obj?.id ?? obj?.Id ?? 0);
  const getMovieId = (obj) => Number(obj?.movieId ?? obj?.MovieId ?? 0);
  const getRoomId = (obj) => Number(obj?.roomId ?? obj?.RoomId ?? 0);
  const getStartTime = (obj) => obj?.startTime ?? obj?.StartTime;
  const getBasePrice = (obj) => Number(obj?.basePrice ?? obj?.BasePrice ?? 0);
  const getSeatId = (obj) => Number(obj?.id ?? obj?.Id ?? 0);
  const getSeatRow = (obj) =>
    (obj?.seatRow ?? obj?.SeatRow ?? "").toString().toUpperCase();
  const getSeatNumber = (obj) =>
    Number(obj?.seatNumber ?? obj?.SeatNumber ?? 0);
  const getSeatType = (obj) =>
    (obj?.type ?? obj?.Type ?? "NORMAL").toString().toUpperCase();
  const getSeatTypeLabel = (type) => {
    const normalized = (type || "").toString().toUpperCase();
    if (normalized === "VIP") return "VIP";
    if (normalized === "COUPLE") return "Đôi";
    return "Thường";
  };
  const hasStarted = (showtime) => {
    const startValue = getStartTime(showtime);
    if (!startValue) return true;
    const startTs = new Date(startValue).getTime();
    return !Number.isFinite(startTs) || startTs <= Date.now();
  };

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!cinemaId || !movieId) {
      setMovie(null);
      setShowtimes([]);
      setSelectedShowtimeId("");
      setSeats([]);
      setBookedSeatIds([]);
      setSelectedSeatIds([]);
      return;
    }

    // Reset state when switching cinema/movie to avoid stale showtime/seat data.
    setSelectedShowtimeId("");
    setSeats([]);
    setBookedSeatIds([]);
    setSelectedSeatIds([]);

    fetch(`${API_BASE}/api/movies`)
      .then((res) => res.json())
      .then((data) => {
        const currentMovie = data.find((m) => getId(m) === movieId);
        setMovie(currentMovie || null);
      })
      .catch((err) => console.error("Lỗi tải phim:", err));

    fetch(
      `${API_BASE}/api/showtimes/by-cinema-movie?cinemaId=${cinemaId}&movieId=${movieId}`,
    )
      .then((res) => res.json())
      .then((data) => setShowtimes(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Lỗi tải suất chiếu:", err));

    fetch(`${API_BASE}/api/rooms/cinema/${cinemaId}`)
      .then((res) => res.json())
      .then((data) => setRooms(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Lỗi tải phòng:", err));
  }, [cinemaId, movieId, navigate, user]);

  useEffect(() => {
    if (!selectedShowtimeId) {
      setSeats([]);
      setBookedSeatIds([]);
      setSelectedSeatIds([]);
      return;
    }

    fetch(
      `${API_BASE}/api/showtimes/${selectedShowtimeId}/booked-seat-ids`,
    )
      .then((res) => res.json())
      .then((data) =>
        setBookedSeatIds(
          Array.isArray(data) ? data.map((id) => Number(id)) : [],
        ),
      )
      .catch((err) => console.error("Lỗi tải ghế đã đặt:", err));

    const selected = showtimes.find(
      (s) => getId(s) === Number(selectedShowtimeId),
    );
    const roomId = getRoomId(selected);
    if (!roomId) {
      setSeats([]);
      return;
    }

    fetch(`${API_BASE}/api/rooms/${roomId}/seats`)
      .then((res) => res.json())
      .then((data) => setSeats(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Lỗi tải ghế:", err));
  }, [selectedShowtimeId, showtimes]);

  const groupedSeats = useMemo(() => {
    const groups = {};
    seats.forEach((seat) => {
      const row = getSeatRow(seat);
      if (!groups[row]) {
        groups[row] = [];
      }
      groups[row].push(seat);
    });

    return Object.entries(groups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([row, rowSeats]) => ({
        row,
        seats: rowSeats.sort((a, b) => getSeatNumber(a) - getSeatNumber(b)),
      }));
  }, [seats]);

  const selectedShowtime = showtimes.find(
    (s) => getId(s) === Number(selectedShowtimeId),
  );

  const getRoomName = (roomId) => {
    const room = rooms.find((r) => getId(r) === Number(roomId));
    return room?.name || room?.Name || "Không rõ";
  };

  const toggleSeat = (seatId) => {
    if (bookedSeatIds.includes(seatId)) {
      return;
    }

    setSelectedSeatIds((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId],
    );
  };

  const toggleSeatGroup = (seatIds) => {
    if (seatIds.some((id) => bookedSeatIds.includes(id))) {
      return;
    }

    setSelectedSeatIds((prev) => {
      const allSelected = seatIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !seatIds.includes(id));
      }
      const next = new Set(prev);
      seatIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  const buildSeatDisplayItems = (rowSeats) => {
    const items = [];
    for (let i = 0; i < rowSeats.length; i += 1) {
      const seat = rowSeats[i];
      if (getSeatType(seat) === "COUPLE") {
        const next = rowSeats[i + 1];
        if (
          next &&
          getSeatType(next) === "COUPLE" &&
          getSeatNumber(next) === getSeatNumber(seat) + 1
        ) {
          items.push({ kind: "COUPLE", seats: [seat, next] });
          i += 1;
          continue;
        }
      }
      items.push({ kind: "SINGLE", seats: [seat] });
    }
    return items;
  };

  const seatPrice = (seat) => {
    if (!getBasePrice(selectedShowtime)) {
      return 0;
    }

    const base = getBasePrice(selectedShowtime);
    const type = getSeatType(seat);
    if (type === "VIP") {
      return base * 1.5;
    }
    if (type === "COUPLE") {
      return base;
    }
    return base;
  };

  const totalPrice = selectedSeatIds.reduce((sum, seatId) => {
    const seat = seats.find((s) => getSeatId(s) === Number(seatId));
    return sum + (seat ? seatPrice(seat) : 0);
  }, 0);

  const handleBooking = () => {
    if (!user?.id) {
      alert("Vui lòng đăng nhập lại để đặt vé.");
      return;
    }

    if (!selectedShowtimeId || selectedSeatIds.length === 0) {
      alert("Vui lòng chọn suất chiếu và ghế.");
      return;
    }

    if (selectedShowtime?.startTime) {
      const startTs = new Date(selectedShowtime.startTime).getTime();
      if (Number.isFinite(startTs) && startTs <= Date.now()) {
        alert("Suất chiếu đã bắt đầu. Vui lòng chọn suất khác.");
        return;
      }
    }

    setLoading(true);

    fetch(`${API_BASE}/api/bookings/payment-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        showtimeId: Number(selectedShowtimeId),
        seatIds: selectedSeatIds,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(await res.text());
        }
        return res.json();
      })
      .then((data) => {
        if (!data?.bookingId) {
          throw new Error("Không tạo được thông tin thanh toán.");
        }
        navigate(`/payment?bookingId=${data.bookingId}`);
      })
      .catch((err) => alert("Tạo thanh toán thất bại: " + err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div style={container}>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Đặt vé</h2>
        <p style={{ marginTop: 0, color: "#555" }}>
          {movie ? `Phim: ${movie.title}` : "Chọn suất chiếu để đặt vé"}
        </p>

        <select
          style={input}
          value={selectedShowtimeId}
          onChange={(e) => setSelectedShowtimeId(e.target.value)}
        >
          <option value=""> Chọn suất chiếu </option>
          {showtimes.map((st) => {
            const started = hasStarted(st);
            const roomName = getRoomName(getRoomId(st));
            return (
              <option
                key={getId(st)}
                value={getId(st)}
                disabled={started}
                style={started ? disabledOption : undefined}
              >
                {getStartTime(st)
                  ? new Date(getStartTime(st)).toLocaleString("vi-VN")
                  : "Không rõ"}{" "}
                - Phòng {roomName} - Giá gốc {getBasePrice(st).toLocaleString()} VND
                {started ? " (Đã bắt đầu)" : ""}
              </option>
            );
          })}
        </select>

        {!selectedShowtimeId && showtimes.length === 0 && (
          <p style={{ color: "#dc2626", marginTop: -6 }}>
            Chưa có suất chiếu cho phim đã chọn.
          </p>
        )}

        {selectedShowtimeId && (
          <>
            <div style={screen}>MÀN HÌNH</div>
            <div style={seatLayout}>
              <div style={seatGrid}>
                {groupedSeats.map((row) => (
                  <div
                    key={row.row}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{ width: 24, fontWeight: "bold" }}>{row.row}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {buildSeatDisplayItems(row.seats).map((item) => {
                        const seatIds = item.seats.map((s) => getSeatId(s));
                        const isBooked = seatIds.some((id) =>
                          bookedSeatIds.includes(id),
                        );
                        const isSelected = seatIds.every((id) =>
                          selectedSeatIds.includes(id),
                        );
                        const isHighlighted =
                          isSelected ||
                          seatIds.some((id) => selectedSeatIds.includes(id));

                        let bg = "#0f766e";
                        if (item.kind === "COUPLE") {
                          bg = "#be185d";
                        } else if (getSeatType(item.seats[0]) === "VIP") {
                          bg = "#d97706";
                        }
                        if (isBooked) {
                          bg = "#9ca3af";
                        }
                        if (isHighlighted) {
                          bg = "#2563eb";
                        }

                        const label =
                          item.kind === "COUPLE"
                            ? `${getSeatNumber(item.seats[0])}-${getSeatNumber(item.seats[1])}`
                            : getSeatNumber(item.seats[0]);

                        return (
                          <button
                            key={seatIds.join("-")}
                            type="button"
                            disabled={isBooked}
                            onClick={() => toggleSeatGroup(seatIds)}
                            style={{
                              width: item.kind === "COUPLE" ? 84 : 42,
                              height: 34,
                              border: "none",
                              borderRadius: 6,
                              color: "white",
                              cursor: isBooked ? "not-allowed" : "pointer",
                              background: bg,
                              fontWeight: "bold",
                            }}
                            title={`${row.row}${label} - ${getSeatTypeLabel(getSeatType(item.seats[0]))}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div style={legendColumn}>
                <div style={legendItem}>
                  <div style={{ ...legendBox, background: "#0f766e" }}></div>
                  Ghế Thường
                </div>
                <div style={legendItem}>
                  <div style={{ ...legendBox, background: "#d97706" }}></div>
                  Ghế VIP
                </div>
                <div style={legendItem}>
                  <div
                    style={{
                      ...legendBox,
                      background: "#be185d",
                      width: 28,
                    }}
                  ></div>
                  Ghế Đôi
                </div>
              </div>
            </div>

            <div style={summaryBox}>
              <div>Số ghế đã chọn: {selectedSeatIds.length}</div>
              <div>Tổng tiền: {totalPrice.toLocaleString("vi-VN")} VND</div>
            </div>

            <button
              style={bookButton}
              disabled={loading}
              onClick={handleBooking}
            >
              {loading ? "Đang xử lý..." : "Thanh toán ngay"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const container = {
  minHeight: "100vh",
  padding: "30px 16px",
  background: "linear-gradient(120deg, #082f49, #0f172a)",
  fontFamily: "Arial, sans-serif",
};

const card = {
  maxWidth: 920,
  margin: "0 auto",
  background: "white",
  borderRadius: 12,
  padding: 24,
  boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
};

const label = { display: "block", marginBottom: 8, fontWeight: "bold" };
const input = {
  width: "100%",
  padding: 10,
  marginBottom: 18,
  borderRadius: 8,
  border: "1px solid #d1d5db",
};
const screen = {
  margin: "10px auto 24px",
  width: "min(100%, 420px)",
  textAlign: "center",
  borderTop: "5px solid #38bdf8",
  color: "#0ea5e9",
  letterSpacing: 2,
  fontWeight: "bold",
  paddingTop: 6,
};
const seatLayout = {
  display: "flex",
  alignItems: "flex-start",
  gap: 20,
  flexWrap: "wrap",
};
const seatGrid = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  flex: "1 1 520px",
};
const legendColumn = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  paddingTop: 6,
  color: "#0f172a",
  minWidth: 140,
};
const legendItem = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontWeight: "600",
};
const legendBox = {
  width: 18,
  height: 18,
  borderRadius: 4,
  border: "1px solid rgba(255,255,255,0.2)",
};
const disabledOption = {
  color: "#9ca3af",
};
const summaryBox = {
  marginTop: 20,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};
const bookButton = {
  marginTop: 16,
  width: "100%",
  padding: 12,
  border: "none",
  borderRadius: 8,
  background: "#dc2626",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};
