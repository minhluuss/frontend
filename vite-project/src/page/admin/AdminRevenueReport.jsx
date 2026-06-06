import { useEffect, useMemo, useState } from "react";

export default function AdminRevenueReport() {
  // --- STATE MỚI CHO RẠP ---
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState("");

  const [weeklyRows, setWeeklyRows] = useState([]);
  const [monthlyRows, setMonthlyRows] = useState([]);
  const [weeklyTopMovies, setWeeklyTopMovies] = useState([]);
  const [monthlyTopMovies, setMonthlyTopMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weeklyTopLoading, setWeeklyTopLoading] = useState(false);
  const [monthlyTopLoading, setMonthlyTopLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [weekFromDate, setWeekFromDate] = useState("");
  const [weekToDate, setWeekToDate] = useState("");
  const [monthFromDate, setMonthFromDate] = useState("");
  const [monthToDate, setMonthToDate] = useState("");

 

  // Lấy danh sách rạp
  useEffect(() => {
    fetch("/api/cinemas")
      .then((res) => res.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setCinemas(rows);
        if (rows.length > 0) {
          setSelectedCinemaId(String(rows[0].id));
        }
      })
      .catch((err) => {
        console.error("Lỗi tải danh sách rạp:", err);
        setCinemas([]);
      });
  }, []);

  // Lấy thống kê doanh thu (gọi lại khi selectedCinemaId thay đổi)
  useEffect(() => {
    if (!selectedCinemaId) {
      setWeeklyRows([]);
      setMonthlyRows([]);
      return;
    }

    setLoading(true);
    const cinemaQuery = `&cinemaId=${selectedCinemaId}`;

    Promise.all([
      fetch(`/api/admin/revenue/weekly?weeks=12${cinemaQuery}`).then(
        (res) => res.json(),
      ),
      fetch(`/api/admin/revenue/monthly?months=12${cinemaQuery}`).then(
        (res) => res.json(),
      ),
    ])
      .then(([weekly, monthly]) => {
        setWeeklyRows(Array.isArray(weekly) ? weekly : []);
        setMonthlyRows(Array.isArray(monthly) ? monthly : []);
      })
      .catch((err) => {
        console.error("Lỗi tải thống kê:", err);
        setWeeklyRows([]);
        setMonthlyRows([]);
      })
      .finally(() => setLoading(false));
  }, [selectedCinemaId]);

  // Lấy top phim theo tuần
  useEffect(() => {
    const range = resolveTopMoviesRange(
      {
        selectedWeek,
        weekFromDate,
        weekToDate,
      },
      "weekly",
    );

    const params = new URLSearchParams({ limit: "50" });
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    if (selectedCinemaId) params.set("cinemaId", selectedCinemaId);

    setWeeklyTopLoading(true);
    fetch(`/api/admin/top-movies?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setWeeklyTopMovies(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Lỗi tải top phim tuần:", err);
        setWeeklyTopMovies([]);
      })
      .finally(() => setWeeklyTopLoading(false));
  }, [selectedWeek, weekFromDate, weekToDate, selectedCinemaId]);

  // Lấy top phim theo tháng
  useEffect(() => {
    const range = resolveTopMoviesRange(
      {
        selectedMonth,
        monthFromDate,
        monthToDate,
      },
      "monthly",
    );

    const params = new URLSearchParams({ limit: "50" });
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    if (selectedCinemaId) params.set("cinemaId", selectedCinemaId); // Thêm cinemaId vào query

    setMonthlyTopLoading(true);
    fetch(`/api/admin/top-movies?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setMonthlyTopMovies(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Lỗi tải top phim tháng:", err);
        setMonthlyTopMovies([]);
      })
      .finally(() => setMonthlyTopLoading(false));
  }, [selectedMonth, monthFromDate, monthToDate, selectedCinemaId]);

  const filteredWeeklyRows = useMemo(() => {
    if (!selectedWeek) return weeklyRows;
    const [yearStr, weekStr] = selectedWeek.split("-W");
    const year = Number(yearStr);
    const week = Number(weekStr);
    if (!year || !week) return weeklyRows;

    const monday = getWeekStartDate(year, week);
    if (!monday) return weeklyRows;
    const key = monday.toISOString().slice(0, 10);
    return weeklyRows.filter((row) => {
      const rowDate = row.weekStart
        ? new Date(row.weekStart).toISOString().slice(0, 10)
        : "";
      return rowDate === key;
    });
  }, [weeklyRows, selectedWeek]);

  const weeklyRangeRows = useMemo(() => {
    if (!weekFromDate && !weekToDate) return filteredWeeklyRows;
    const from = weekFromDate ? new Date(weekFromDate) : null;
    const to = weekToDate ? new Date(weekToDate) : null;

    return filteredWeeklyRows.filter((row) => {
      if (!row.weekStart) return false;
      const rowDate = new Date(row.weekStart);
      if (from && rowDate < from) return false;
      if (to) {
        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);
        if (rowDate > endOfDay) return false;
      }
      return true;
    });
  }, [filteredWeeklyRows, weekFromDate, weekToDate]);

  const filteredMonthlyRows = useMemo(() => {
    if (!selectedMonth) return monthlyRows;
    return monthlyRows.filter((row) => row.month === selectedMonth);
  }, [monthlyRows, selectedMonth]);

  const monthlyRangeRows = useMemo(() => {
    if (!monthFromDate && !monthToDate) return filteredMonthlyRows;
    const from = monthFromDate ? new Date(`${monthFromDate}-01`) : null;
    const to = monthToDate ? new Date(`${monthToDate}-01`) : null;

    return filteredMonthlyRows.filter((row) => {
      if (!row.month) return false;
      const rowDate = new Date(`${row.month}-01`);
      if (from && rowDate < from) return false;
      if (to) {
        const endMonth = new Date(to.getFullYear(), to.getMonth() + 1, 0, 23, 59, 59, 999);
        if (rowDate > endMonth) return false;
      }
      return true;
    });
  }, [filteredMonthlyRows, monthFromDate, monthToDate]);

  const weeklyTotal = useMemo(() => {
    return weeklyRangeRows.reduce(
      (sum, row) => sum + Number(row.revenue || 0),
      0,
    );
  }, [weeklyRangeRows]);

  const monthlyTotal = useMemo(() => {
    return monthlyRangeRows.reduce(
      (sum, row) => sum + Number(row.revenue || 0),
      0,
    );
  }, [monthlyRangeRows]);

  return (
    <div style={container}>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Thống kê doanh thu</h2>

        <div style={filterRow}>
          <label style={filterLabel}>Rạp</label>
          <select
            value={selectedCinemaId}
            onChange={(e) => setSelectedCinemaId(e.target.value)}
            style={filterInput}
          >
            {cinemas.length === 0 && <option value="">Không có rạp</option>}
            {cinemas.map((cinema) => (
              <option key={cinema.id} value={cinema.id}>
                {cinema.name}
              </option>
            ))}
          </select>
        </div>

        {loading && <div style={loadingText}>Đang tải dữ liệu...</div>}

        <div style={grid}>
          <div style={statBox}>
            <div style={statLabel}>
              Doanh thu {selectedWeek ? "tuần đã chọn" : "12 tuần"}
            </div>
            <div style={statValue}>{weeklyTotal.toLocaleString("vi-VN")} VND</div>
          </div>
          <div style={statBox}>
            <div style={statLabel}>
              Doanh thu {selectedMonth ? "tháng đã chọn" : "12 tháng"}
            </div>
            <div style={statValue}>{monthlyTotal.toLocaleString("vi-VN")} VND</div>
          </div>
        </div>

        <h3 style={sectionTitle}>Theo tuần</h3>
        <div style={filterRow}>
          <label style={filterLabel}>Chọn tuần</label>
          <input
            type="week"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            style={filterInput}
          />
          <label style={filterLabel}>Từ ngày</label>
          <input
            type="date"
            value={weekFromDate}
            onChange={(e) => setWeekFromDate(e.target.value)}
            style={filterInput}
          />
          <label style={filterLabel}>Đến ngày</label>
          <input
            type="date"
            value={weekToDate}
            onChange={(e) => setWeekToDate(e.target.value)}
            style={filterInput}
          />
          {selectedWeek && (
            <button style={clearBtn} onClick={() => setSelectedWeek("")}>
              Xóa lọc
            </button>
          )}
          {(weekFromDate || weekToDate) && (
            <button
              style={clearBtn}
              onClick={() => {
                setWeekFromDate("");
                setWeekToDate("");
              }}
            >
              Xóa khoảng
            </button>
          )}
        </div>
        <div className="responsive-table-wrapper" style={{ maxHeight: "400px", overflowY: "auto" }}>
          <table className="responsive-table" style={table}>
          <thead>
            <tr>
              <th style={th}>Phim</th>
              <th style={th}>Phòng</th>
              <th style={th}>Số ghế đặt</th>
              <th style={th}>Số đơn</th>
            </tr>
          </thead>
          <tbody>
            {weeklyTopLoading && (
              <tr>
                <td colSpan={5} style={tdCenter}>
                  Đang tải top phim...
                </td>
              </tr>
            )}
            {!weeklyTopLoading && weeklyTopMovies.length === 0 && (
              <tr>
                <td colSpan={5} style={tdCenter}>
                  Không có dữ liệu
                </td>
              </tr>
            )}
            {weeklyTopMovies.map((row, idx) => (
              <tr key={`${row.movieId}-${row.roomId}-${idx}`}>
                <td style={td}>{row.movieTitle}</td>
                <td style={td}>{row.roomName}</td>
                <td style={td}>{row.seatCount}</td>
                <td style={td}>{row.bookingCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <h3 style={sectionTitle}>Theo tháng</h3>
        <div style={filterRow}>
          <label style={filterLabel}>Chọn tháng</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={filterInput}
          />
          <label style={filterLabel}>Từ tháng</label>
          <input
            type="month"
            value={monthFromDate}
            onChange={(e) => setMonthFromDate(e.target.value)}
            style={filterInput}
          />
          <label style={filterLabel}>Đến tháng</label>
          <input
            type="month"
            value={monthToDate}
            onChange={(e) => setMonthToDate(e.target.value)}
            style={filterInput}
          />
          {selectedMonth && (
            <button style={clearBtn} onClick={() => setSelectedMonth("")}>
              Xóa lọc
            </button>
          )}
          {(monthFromDate || monthToDate) && (
            <button
              style={clearBtn}
              onClick={() => {
                setMonthFromDate("");
                setMonthToDate("");
              }}
            >
              Xóa khoảng
            </button>
          )}
        </div>
        <div className="responsive-table-wrapper">
          <table className="responsive-table" style={table}>
            <thead>
              <tr>
                <th style={th}>Phim</th>
                <th style={th}>Phòng</th>
                <th style={th}>Số ghế đặt</th>
                <th style={th}>Số đơn</th>
              </tr>
          </thead>
          <tbody>
            {monthlyTopLoading && (
              <tr>
                <td colSpan={5} style={tdCenter}>
                  Đang tải top phim...
                </td>
              </tr>
            )}
            {!monthlyTopLoading && monthlyTopMovies.length === 0 && (
              <tr>
                <td colSpan={5} style={tdCenter}>
                  Không có dữ liệu
                </td>
              </tr>
            )}
            {monthlyTopMovies.map((row, idx) => (
              <tr key={`${row.movieId}-${row.roomId}-${idx}`}>
                <td style={td}>{row.movieTitle}</td>
                <td style={td}>{row.roomName}</td>
                <td style={td}>{row.seatCount}</td>
                <td style={td}>{row.bookingCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
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

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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

const sectionTitle = { marginTop: 24, marginBottom: 12 };
const loadingText = { marginBottom: 12, color: "#475569" };

// Style mới cho hàng lọc toàn cục (global filter)
const globalFilterRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 24,
  padding: "16px",
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  border: "1px solid #e2e8f0"
};

const filterRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 12,
  flexWrap: "wrap",
};
const filterLabel = {
  fontSize: 14,
  fontWeight: "600",
  color: "#334155",
};
const filterInput = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "white",
  minWidth: "150px"
};
const clearBtn = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  background: "#e2e8f0",
  color: "#0f172a",
  fontWeight: "600",
  cursor: "pointer",
};

const table = { width: "100%", borderCollapse: "collapse", minWidth: 720 };
const th = {
  textAlign: "left",
  padding: "10px 8px",
  borderBottom: "2px solid #e5e7eb",
  background: "#f1f5f9",
};
const td = { padding: "10px 8px", borderBottom: "1px solid #e5e7eb" };
const tdCenter = { ...td, textAlign: "center" };

// --- HELPER FUNCTIONS ---
function getWeekStartDate(year, week) {
  if (!year || !week) return null;
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dayOfWeek = simple.getUTCDay();
  const isoWeekStart = new Date(simple);
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  isoWeekStart.setUTCDate(simple.getUTCDate() + diff);
  return isoWeekStart;
}

function resolveTopMoviesRange(filters, type) {
  const {
    selectedWeek,
    selectedMonth,
    weekFromDate,
    weekToDate,
    monthFromDate,
    monthToDate,
  } = filters;

  if (type === "weekly" && (weekFromDate || weekToDate || selectedWeek)) {
    let from = weekFromDate || "";
    let to = weekToDate || "";

    if (selectedWeek) {
      const [yearStr, weekStr] = selectedWeek.split("-W");
      const year = Number(yearStr);
      const week = Number(weekStr);
      const weekStart = getWeekStartDate(year, week);
      if (weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        from = weekStart.toISOString().slice(0, 10);
        to = weekEnd.toISOString().slice(0, 10);
      }
    }

    return { from: from || undefined, to: to || undefined };
  }

  if (type === "monthly" && (monthFromDate || monthToDate || selectedMonth)) {
    let from = monthFromDate || "";
    let to = monthToDate || "";

    if (selectedMonth) {
      const [yearStr, monthStr] = selectedMonth.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr) - 1;
      if (!Number.isNaN(year) && !Number.isNaN(month)) {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);
        from = start.toISOString().slice(0, 10);
        to = end.toISOString().slice(0, 10);
      }
    }

    return { from: from || undefined, to: to || undefined };
  }

  return { from: undefined, to: undefined };
}