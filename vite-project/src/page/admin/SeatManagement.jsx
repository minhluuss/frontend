import { useState, useEffect } from "react";

export default function SeatManagement() {
  // 🎯 Thêm State cho Rạp
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState("");

  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [targetCount, setTargetCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentSeats, setCurrentSeats] = useState([]);

  const getSeatRow = (seat) =>
    (seat?.seatRow ?? seat?.SeatRow ?? "").toString().trim().toUpperCase();
  const getSeatNumber = (seat) =>
    Number(seat?.seatNumber ?? seat?.SeatNumber ?? 0);
  const getSeatType = (seat) =>
    (seat?.type ?? seat?.Type ?? "NORMAL").toString().toUpperCase();

  // 1. Khi load trang, lấy danh sách tất cả các RẠP
  useEffect(() => {
    fetch("/api/cinemas")
      .then((res) => res.json())
      .then((data) => setCinemas(data))
      .catch((err) => console.error("Lỗi lấy danh sách rạp:", err));
  }, []);

  // 2. Khi Admin CHỌN RẠP, lấy danh sách PHÒNG của rạp đó
  useEffect(() => {
    if (!selectedCinemaId) {
      // Nếu không chọn rạp nào, xóa trắng danh sách phòng và ghế
      setRooms([]);
      setSelectedRoomId("");
      setCurrentSeats([]);
      setTargetCount(0);
      return;
    }

    // 🎯 GỌI ĐÚNG API VỪA SỬA Ở BACKEND
    fetch(`/api/rooms/cinema/${selectedCinemaId}`)
      .then((res) => res.json())
      .then((data) => {
        setRooms(data);
        // Reset lại phòng và ghế khi đổi rạp
        setSelectedRoomId("");
        setCurrentSeats([]);
        setTargetCount(0);
      })
      .catch((err) => console.error("Lỗi lấy danh sách phòng:", err));
  }, [selectedCinemaId]);

  const fetchCurrentSeats = (roomId) => {
    if (!roomId) {
      setCurrentSeats([]);
      setTargetCount(0);
      return;
    }
    fetch(`/api/rooms/${roomId}/seats`)
      .then((res) => res.json())
      .then((data) => {
        setCurrentSeats(data);
        setTargetCount(data.length);
      })
      .catch((err) => console.error("Lỗi lấy ghế:", err));
  };

  const handleSync = () => {
    if (!selectedRoomId) return;
    setLoading(true);
    fetch(
      `/api/rooms/${selectedRoomId}/sync-seats?targetCount=${targetCount}`,
      {
        method: "PUT",
      },
    )
      .then((res) => res.text())
      .then((msg) => {
        alert("✅ " + msg);
        fetchCurrentSeats(selectedRoomId);
      })
      .catch((err) => alert("❌ Lỗi: " + err.message))
      .finally(() => setLoading(false));
  };

  const getRowLabel = (index) => String.fromCharCode(65 + index);

  const renderSeatGrid = () => {
    const rows = [];
    const effectiveCount = Math.max(targetCount, currentSeats.length);
    const numRows = Math.ceil(effectiveCount / 10);

    for (let i = 0; i < numRows; i++) {
      const rowSeats = [];
      const currentRowChar = getRowLabel(i);

      for (let j = 1; j <= 10; j++) {
        const seatIndex = i * 10 + j;

        if (seatIndex <= effectiveCount) {
          const dbSeat = currentSeats.find(
            (s) => getSeatRow(s) === currentRowChar && getSeatNumber(s) === j,
          );

          const isNewSeat = !dbSeat;
          const seatType = dbSeat ? getSeatType(dbSeat) : "NORMAL";

          let currentStyle = { ...seatIcon };
          let titleText = `Hàng ${currentRowChar} - Ghế ${j}`;

          if (isNewSeat) {
            currentStyle = {
              ...seatIcon,
              background: "#faad14",
              border: "1px dashed #ffe58f",
              color: "#fff",
            };
            titleText += " (Sắp thêm mới)";
          } else {
            if (seatType === "VIP") {
              currentStyle = {
                ...seatIcon,
                background: "#ef4444",
                border: "1px solid #f87171",
                color: "#fff",
              };
              titleText += " (Hạng VIP)";
            } else if (seatType === "COUPLE") {
              currentStyle = {
                ...seatIcon,
                background: "#ec4899",
                border: "1px solid #f472b6",
                color: "#fff",
              };
              titleText += " (Hạng Đôi)";
            } else {
              currentStyle = {
                ...seatIcon,
                background: "#334155",
                border: "1px solid #475569",
                color: "#cbd5e1",
              };
              titleText += " (Hạng Thường)";
            }
          }

          rowSeats.push(
            <div
              key={`${currentRowChar}-${j}`}
              style={currentStyle}
              title={titleText}
            >
              {j}
            </div>,
          );
        }
      }
      rows.push(
        <div key={currentRowChar} style={rowWrapper}>
          <div style={rowLabel}>{currentRowChar}</div>
          <div style={seatsRow}>{rowSeats}</div>
        </div>,
      );
    }
    return rows;
  };

  return (
    <div style={container}>
      <div style={card}>
        <h2
          style={{ textAlign: "center", marginBottom: "20px", color: "#333" }}
        >
          ⚙️ Cấu hình Sơ đồ Ghế
        </h2>

        {/* 🎬 1. KHU VỰC CHỌN RẠP */}
        <label style={label}>1. Chọn Rạp chiếu:</label>
        <select
          onChange={(e) => setSelectedCinemaId(e.target.value)}
          style={input}
          value={selectedCinemaId}
        >
          <option value="">-- Vui lòng chọn Rạp --</option>
          {/* Bắt lỗi Id viết hoa hay viết thường tùy Database */}
          {cinemas.map((c) => (
            <option key={c.Id || c.id} value={c.Id || c.id}>
              {c.Name || c.name}
            </option>
          ))}
        </select>

        {/* 🚪 2. KHU VỰC CHỌN PHÒNG (Chỉ hiện khi đã chọn Rạp) */}
        {selectedCinemaId && (
          <>
            <label style={label}>2. Chọn Phòng chiếu:</label>
            <select
              onChange={(e) => {
                setSelectedRoomId(e.target.value);
                fetchCurrentSeats(e.target.value);
              }}
              style={input}
              value={selectedRoomId}
            >
              <option value="">-- Vui lòng chọn Phòng --</option>
              {rooms.map((r) => {
                const roomId = r.id ?? r.Id;
                const roomName = r.name ?? r.Name;
                return (
                  <option key={roomId} value={roomId}>
                    {roomName}
                  </option>
                );
              })}
            </select>
          </>
        )}

        {/* 🪑 3. KHU VỰC CẬP NHẬT GHẾ (Chỉ hiện khi đã chọn Phòng) */}
        {selectedRoomId && (
          <>
            <label style={label}>
              Số lượng ghế (Đang có: {currentSeats.length})
            </label>
            <input
              type="number"
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value) || 0)}
              style={input}
            />
            <button onClick={handleSync} style={button} disabled={loading}>
              {loading ? "Đang xử lý..." : "Lưu Cấu Hình Ghế"}
            </button>
          </>
        )}
      </div>

      {/* KHU VỰC PREVIEW HIỂN THỊ GHẾ */}
      {Math.max(targetCount, currentSeats.length) > 0 && selectedRoomId && (
        <div style={previewCard}>
          <h3
            style={{
              textAlign: "center",
              marginBottom: "20px",
              color: "#e2e8f0",
            }}
          >
            🎬 Sơ đồ phòng chiếu (10 ghế/hàng)
          </h3>
          <div style={screenDivider}>MÀN HÌNH</div>
          <div style={gridContainer}>{renderSeatGrid()}</div>
          <div style={legendContainer}>
            <div style={legendItem}>
              <div style={{ ...legendBox, background: "#334155" }}></div> Ghế
              Thường
            </div>
            <div style={legendItem}>
              <div style={{ ...legendBox, background: "#ef4444" }}></div> Ghế
              VIP
            </div>
            <div style={legendItem}>
              <div style={{ ...legendBox, background: "#ec4899" }}></div> Ghế
              Đôi
            </div>
            {targetCount > currentSeats.length && (
              <div style={legendItem}>
                <div
                  style={{
                    ...legendBox,
                    background: "#faad14",
                    border: "1px dashed #ffe58f",
                  }}
                ></div>{" "}
                Sắp thêm
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// === STYLES ===
const container = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  paddingTop: "50px",
  paddingBottom: "50px",
  minHeight: "100vh",
  background: "linear-gradient(to right, #141e30, #243b55)",
  fontFamily: "Arial, sans-serif",
};
const card = {
  width: "450px",
  padding: "30px",
  background: "white",
  borderRadius: "12px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
  marginBottom: "30px",
  boxSizing: "border-box",
};
const previewCard = {
  width: "700px",
  padding: "30px",
  background: "#1e293b",
  borderRadius: "12px",
  boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
  color: "white",
  boxSizing: "border-box",
};
const label = {
  display: "block",
  marginBottom: "8px",
  fontSize: "14px",
  fontWeight: "bold",
  color: "#444",
};
const input = {
  width: "100%",
  padding: "12px",
  marginBottom: "20px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "15px",
  boxSizing: "border-box",
  outline: "none",
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
const screenDivider = {
  width: "70%",
  height: "6px",
  background: "#38bdf8",
  margin: "0 auto 40px auto",
  borderRadius: "20px",
  boxShadow: "0 4px 15px rgba(56, 189, 248, 0.5)",
  textAlign: "center",
  color: "#38bdf8",
  fontSize: "12px",
  lineHeight: "35px",
  fontWeight: "bold",
  letterSpacing: "2px",
};
const gridContainer = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  alignItems: "center",
};
const rowWrapper = { display: "flex", alignItems: "center", gap: "15px" };
const rowLabel = {
  width: "25px",
  fontWeight: "bold",
  color: "#fbbf24",
  fontSize: "16px",
  textAlign: "right",
};
const seatsRow = { display: "flex", gap: "8px" };
const seatIcon = {
  width: "35px",
  height: "35px",
  background: "#334155",
  border: "1px solid #475569",
  borderRadius: "6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: "bold",
  color: "#cbd5e1",
};
const legendContainer = {
  display: "flex",
  justifyContent: "center",
  gap: "25px",
  marginTop: "40px",
  paddingTop: "20px",
  borderTop: "1px solid #334155",
  flexWrap: "wrap",
};
const legendItem = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "14px",
  color: "#cbd5e1",
  fontWeight: "bold",
};
const legendBox = {
  width: "20px",
  height: "20px",
  borderRadius: "4px",
  border: "1px solid #475569",
};
