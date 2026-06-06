import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CinemaHeader({
  cinemaName,
  cinemaId,
  hideBackButton,
  activeMovieTab = "NOW_SHOWING",
  onMovieTabChange,
  showMovieTabs = true,
  showScheduleButton = false,
  showSearch = false,
  searchValue,
  onSearchChange,
  onSearchSubmit,
}) {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const [hoveredAction, setHoveredAction] = useState("");
  const [showMovieDropdown, setShowMovieDropdown] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const userId = user?.id ?? user?.Id;
  const username = (user?.username ?? user?.Username ?? "").toString().trim();
  const role = (user?.role ?? user?.Role ?? "").toString().toUpperCase();
  const isLoggedIn = Boolean(userId && username);
  const resolvedSearchValue =
    typeof searchValue === "string" ? searchValue : localSearch;
  const canShowScheduleButton = Boolean(showScheduleButton && cinemaId);
  const canShowMovieNavButton = Boolean(!showMovieTabs && cinemaId);
  const canShowAdminDashboard = Boolean(role === "ADMIN");

  if (!isLoggedIn && localStorage.getItem("user")) {
    localStorage.removeItem("user");
  }

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSearchChange = (event) => {
    const nextValue = event.target.value;
    setLocalSearch(nextValue);
    if (onSearchChange) onSearchChange(nextValue);
  };

  const handleSearchSubmit = () => {
    if (onSearchSubmit) onSearchSubmit(resolvedSearchValue);
  };


  return (
    <header style={headerStyle}>
      <div style={leftGroup}>
        {!hideBackButton && (
          <button onClick={() => navigate("/home")} style={backBtn}>
            Quay lại
          </button>
        )}
        <div style={cinemaInfo}>
          <h1 style={nameStyle}>{cinemaName || "Đang tải..."}</h1>
        </div>
      </div>

      {showMovieTabs ? (
        <div style={centerRow}>
          <div
            style={centerGroup}
            onMouseEnter={() => setShowMovieDropdown(true)}
            onMouseLeave={() => setShowMovieDropdown(false)}
          >
            <button style={movieDropdownBtn} type="button">
              Phim ▾
            </button>
            {showMovieDropdown && (
              <>
                <div style={menuHoverBridge}></div>
                <div style={movieDropdownMenu}>
                  <button
                    style={
                      activeMovieTab === "NOW_SHOWING"
                        ? activeDropdownItem
                        : dropdownItem
                    }
                    onClick={() =>
                      onMovieTabChange && onMovieTabChange("NOW_SHOWING")
                    }
                    type="button"
                  >
                    Phim đang chiếu
                  </button>
                  <button
                    style={
                      activeMovieTab === "COMING_SOON"
                        ? activeDropdownItem
                        : dropdownItem
                    }
                    onClick={() =>
                      onMovieTabChange && onMovieTabChange("COMING_SOON")
                    }
                    type="button"
                  >
                    Phim sắp chiếu
                  </button>
                </div>
              </>
            )}
          </div>
          {canShowScheduleButton && (
            <button
              style={scheduleBtn}
              onClick={() => navigate(`/cinemapage/${cinemaId}/showtimes`)}
            >
              Lịch chiếu
            </button>
          )}
        </div>
      ) : (
        <div style={centerRow}>
          {canShowMovieNavButton && (
            <button
              style={movieNavBtn}
              onClick={() => navigate(`/cinemapage/${cinemaId}`)}
            >
              Phim
            </button>
          )}
          {canShowScheduleButton && (
            <button
              style={scheduleBtn}
              onClick={() => navigate(`/cinemapage/${cinemaId}/showtimes`)}
            >
              Lịch chiếu
            </button>
          )}
        </div>
      )}

      <div style={rightGroup}>
        {showSearch && (
          <div style={searchWrap}>
            <input
              style={searchInput}
              type="text"
              placeholder="Tìm phim..."
              value={resolvedSearchValue}
              onChange={handleSearchChange}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSearchSubmit();
              }}
            />
            <button style={searchBtn} onClick={handleSearchSubmit}>
              Tìm
            </button>
          </div>
        )}
        {isLoggedIn ? (
          <div
            style={userMenuWrap}
            onMouseEnter={() => setShowLogout(true)}
            onMouseLeave={() => setShowLogout(false)}
          >
            {canShowAdminDashboard && (
              <button
                style={adminBtn}
                onClick={() => navigate("/admin")}
              >
                Bảng điều khiển
              </button>
            )}
            {role !== "ADMIN" && (
              <button
                style={historyBtn}
                onClick={() => navigate("/booking-history")}
              >
                Lịch sử
              </button>
            )}
            <div style={helloText}>Xin chào, {username}</div>
            {showLogout && (
              <>
                <div style={hoverBridge}></div>
                <div style={userDropdownMenu}>
                  <button
                    style={
                      hoveredAction === "logout"
                        ? userDropdownItemHover
                        : userDropdownItem
                    }
                    onMouseEnter={() => setHoveredAction("logout")}
                    onMouseLeave={() => setHoveredAction("")}
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </button>
                  <button
                    style={
                      hoveredAction === "changePassword"
                        ? userDropdownItemHover
                        : userDropdownItem
                    }
                    onMouseEnter={() => setHoveredAction("changePassword")}
                    onMouseLeave={() => setHoveredAction("")}
                    onClick={() => navigate("/change-password")}
                  >
                    Đổi mật khẩu
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button style={loginBtn} onClick={() => navigate("/login")}>
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}

// 🎨 Styles cho Header
const headerStyle = {
  width: "100%",
  background:
    "linear-gradient(120deg, rgba(10,14,25,0.95), rgba(24,33,56,0.92))",
  backdropFilter: "blur(6px)",
  padding: "14px 26px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 10px 28px rgba(0,0,0,0.38)",
  position: "sticky", // Giữ header luôn ở trên cùng khi cuộn trang
  top: 0,
  zIndex: 1000,
  boxSizing: "border-box",
  minHeight: "74px",
};

const leftGroup = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  minWidth: "260px",
};
const centerGroup = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "6px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "12px",
  position: "relative",
};
const centerRow = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};
const cinemaInfo = { display: "flex", flexDirection: "column" };
const rightGroup = {
  textAlign: "right",
  color: "#e5e7eb",
  minWidth: "220px",
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "12px",
};
const adminBtn = {
  padding: "8px 14px",
  background: "rgba(255,255,255,0.12)",
  color: "#f8fafc",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
};
const userMenuWrap = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
};
const nameStyle = {
  color: "#f8fafc",
  fontSize: "21px",
  margin: 0,
  letterSpacing: "0.8px",
  textTransform: "uppercase",
  fontWeight: "800",
  textShadow: "0 2px 12px rgba(239,68,68,0.35)",
};
const locStyle = { color: "#9ca3af", fontSize: "14px", margin: "5px 0 0 0" };
const helloText = {
  fontSize: "14px",
  fontWeight: "700",
  padding: "9px 13px",
  borderRadius: "10px",
  background:
    "linear-gradient(180deg, rgba(59,130,246,0.22), rgba(15,23,42,0.15))",
  border: "1px solid rgba(96,165,250,0.45)",
  color: "#e2e8f0",
  cursor: "default",
};
const loginBtn = {
  padding: "9px 14px",
  background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
  boxShadow: "0 8px 16px rgba(37,99,235,0.34)",
};
const movieDropdownBtn = {
  padding: "9px 14px",
  borderRadius: "9px",
  border: "none",
  background: "transparent",
  color: "#cbd5e1",
  cursor: "pointer",
  fontWeight: "700",
  transition: "all .18s ease",
};
const movieNavBtn = {
  padding: "9px 14px",
  borderRadius: "9px",
  border: "1px solid rgba(148,163,184,0.35)",
  background: "transparent",
  color: "#e2e8f0",
  cursor: "pointer",
  fontWeight: "700",
};
const menuHoverBridge = {
  position: "absolute",
  top: "100%",
  left: "6px",
  width: "190px",
  height: "10px",
};
const movieDropdownMenu = {
  position: "absolute",
  top: "calc(100% + 8px)",
  left: "6px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  background: "rgba(15,23,42,0.95)",
  border: "1px solid rgba(148,163,184,0.35)",
  borderRadius: "12px",
  padding: "8px",
  minWidth: "180px",
  boxShadow: "0 12px 24px rgba(0,0,0,0.45)",
  zIndex: 20,
};
const dropdownItem = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid transparent",
  background: "rgba(30,41,59,0.5)",
  color: "#cbd5e1",
  cursor: "pointer",
  fontWeight: "600",
  textAlign: "left",
};
const activeDropdownItem = {
  ...dropdownItem,
  background: "linear-gradient(135deg, #ef4444, #f97316)",
  border: "1px solid rgba(248,113,113,0.8)",
  color: "#ffffff",
  boxShadow: "0 8px 16px rgba(239,68,68,0.35)",
};
const backBtn = {
  padding: "10px 14px",
  background: "rgba(30,41,59,0.72)",
  color: "#f8fafc",
  border: "1px solid rgba(148,163,184,0.3)",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
};
const hoverBridge = {
  position: "absolute",
  top: "100%",
  right: "8px",
  width: "120px",
  height: "12px",
};
const historyBtn = {
  padding: "9px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(94,234,212,0.45)",
  background:
    "linear-gradient(135deg, rgba(15,118,110,0.25), rgba(20,184,166,0.3))",
  color: "#ccfbf1",
  fontWeight: "700",
  cursor: "pointer",
};
const userDropdownMenu = {
  position: "absolute",
  top: "calc(100% + 10px)",
  right: 0,
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  background: "rgba(15,23,42,0.95)",
  border: "1px solid rgba(148,163,184,0.35)",
  borderRadius: "12px",
  padding: "8px",
  minWidth: "180px",
  boxShadow: "0 12px 24px rgba(0,0,0,0.45)",
  zIndex: 20,
};
const userDropdownItem = {
  padding: "9px 12px",
  borderRadius: "8px",
  border: "1px solid transparent",
  background: "rgba(30,41,59,0.5)",
  color: "#cbd5e1",
  cursor: "pointer",
  fontWeight: "600",
  textAlign: "left",
  transition: "all .18s ease",
};
const userDropdownItemHover = {
  ...userDropdownItem,
  background: "linear-gradient(135deg, rgba(59,130,246,0.35), rgba(14,165,233,0.4))",
  border: "1px solid rgba(125,211,252,0.6)",
  color: "#e0f2fe",
};
const scheduleBtn = {
  padding: "9px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(148,163,184,0.35)",
  background: "transparent",
  color: "#e2e8f0",
  fontWeight: "700",
  cursor: "pointer",
};

const searchWrap = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px",
  borderRadius: "12px",
  background: "rgba(15,23,42,0.55)",
  border: "1px solid rgba(148,163,184,0.3)",
};

const searchInput = {
  width: "180px",
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid rgba(148,163,184,0.35)",
  background: "rgba(2,6,23,0.7)",
  color: "#e2e8f0",
  outline: "none",
};

const searchBtn = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid rgba(94,234,212,0.45)",
  background: "linear-gradient(135deg, rgba(15,118,110,0.6), #0ea5e9)",
  color: "#e2e8f0",
  fontWeight: "700",
  cursor: "pointer",
};
