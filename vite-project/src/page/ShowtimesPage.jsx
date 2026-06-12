import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CinemaHeader from "./CinemaHeader";
const API_BASE = import.meta.env.VITE_API_BASE_URL;
export default function ShowtimesPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cinema, setCinema] = useState(null);
  const [movies, setMovies] = useState([]);
  const [allCinemaMovies, setAllCinemaMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cinemaShowtimes, setCinemaShowtimes] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [dateHasShowtimes, setDateHasShowtimes] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTrailer, setSelectedTrailer] = useState(null);

  const getId = (obj) => Number(obj?.id ?? obj?.Id ?? 0);
  const getRoomId = (obj) => Number(obj?.roomId ?? obj?.RoomId ?? 0);
  const getMovieId = (obj) => Number(obj?.movieId ?? obj?.MovieId ?? 0);
  const getStatus = (obj) =>
    (obj?.status ?? obj?.Status ?? "").toString().toUpperCase();

  const toDateKey = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const dayNames = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];

  const buildNextDays = (baseDate, count) => {
    const list = [];
    for (let i = 0; i < count; i += 1) {
      const next = new Date(baseDate);
      next.setDate(baseDate.getDate() + i);
      const key = toDateKey(next);
      if (key) list.push(key);
    }
    return list;
  };

  useEffect(() => {
    let isMounted = true;

    fetch(`${API_BASE}/api/cinemas/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          setCinema(data[0]);
        } else {
          setCinema(data);
        }
      })
      .catch((err) => console.error("Lỗi tải rạp:", err));

    Promise.all([
      fetch(`${API_BASE}/api/rooms/cinema/${id}`).then((res) =>
        res.json(),
      ),
      fetch(`${API_BASE}/api/showtimes`).then((res) => res.json()),
      fetch(`${API_BASE}/api/movies`).then((res) => res.json()),
    ])
      .then(([roomsData, showtimesData, moviesData]) => {
        if (!isMounted) return;

        const roomIds = new Set((roomsData || []).map((r) => getId(r)));
        const rawShowtimesInCinema = (showtimesData || []).filter((st) =>
          roomIds.has(getRoomId(st)),
        );
        const stoppedMovieIds = new Set(
          (moviesData || [])
            .filter((m) => getStatus(m) === "STOPPED")
            .map((m) => getId(m)),
        );
        const showtimesInCinema = rawShowtimesInCinema.filter(
          (st) => !stoppedMovieIds.has(getMovieId(st)),
        );
        const movieIdsInCinema = new Set(
          showtimesInCinema.map((st) => getMovieId(st)),
        );

        const today = new Date();
        const dateKeys = buildNextDays(today, 10);
        const showtimeFlags = showtimesInCinema.reduce((acc, st) => {
          const key = toDateKey(st?.startTime ?? st?.StartTime);
          if (key) acc[key] = true;
          return acc;
        }, {});

        const filteredMovies = (moviesData || []).filter((m) => {
          const movieId = getId(m);
          if (!movieIdsInCinema.has(movieId)) return false;
          return getStatus(m) !== "STOPPED";
        });

        setAllCinemaMovies(filteredMovies);
        setCinemaShowtimes(showtimesInCinema);
        setAvailableDates(dateKeys);
        setDateHasShowtimes(showtimeFlags);
      })
      .catch((err) => {
        console.error("Lỗi tải lịch chiếu:", err);
        if (isMounted) {
          setAllCinemaMovies([]);
          setMovies([]);
          setCinemaShowtimes([]);
          setAvailableDates([]);
          setSelectedDateKey("");
          setDateHasShowtimes({});
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!availableDates.length) return;
    if (!selectedDateKey || !availableDates.includes(selectedDateKey)) {
      setSelectedDateKey(availableDates[0]);
    }
  }, [availableDates, selectedDateKey]);

  useEffect(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const activeShowtimes = selectedDateKey
      ? cinemaShowtimes.filter((st) => {
          const key = toDateKey(st?.startTime ?? st?.StartTime);
          return key === selectedDateKey;
        })
      : cinemaShowtimes;
    const movieIdsForDate = new Set(
      activeShowtimes.map((st) => getMovieId(st)),
    );

    const next = allCinemaMovies.filter((m) => {
      const movieId = getId(m);
      if (selectedDateKey && !movieIdsForDate.has(movieId)) {
        return false;
      }

      if (!normalizedQuery) return true;

      const title = (m?.title ?? m?.Title ?? "").toString().toLowerCase();
      const genre = (m?.genre ?? m?.Genre ?? "").toString().toLowerCase();
      const description = (m?.description ?? m?.Description ?? "")
        .toString()
        .toLowerCase();
      const director = (m?.director ?? m?.Director ?? "")
        .toString()
        .toLowerCase();
      return (
        title.includes(normalizedQuery) ||
        genre.includes(normalizedQuery) ||
        description.includes(normalizedQuery) ||
        director.includes(normalizedQuery)
      );
    });

    setMovies(next);
  }, [
    allCinemaMovies,
    cinemaShowtimes,
    searchTerm,
    selectedDateKey,
  ]);

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}?autoplay=1`
      : null;
  };

  const handleWatchTrailer = (trailerUrl) => {
    const embedUrl = getYouTubeEmbedUrl(trailerUrl);
    if (embedUrl) {
      setSelectedTrailer(embedUrl);
    } else {
      alert("Phim này hiện chưa có trailer hoặc link bị lỗi!");
    }
  };

  const goToMovieDetail = (movie) => {
    const movieId = movie?.id ?? movie?.Id;
    if (!movieId) return;
    navigate(`${API_BASE}/cinemapage/${id}/movie/${movieId}`);
  };

  const formatDuration = (minutes) => {
    const total = Number(minutes) || 0;
    if (!total) return "Chưa cập nhật";
    return `${total} phút`;
  };

  const formatDateLabel = (dateKey) => {
    const date = new Date(`${dateKey}T00:00:00`);
    const dayName = dayNames[date.getDay()] || "";
    return {
      day: dayName,
      date: date.toLocaleDateString("vi-VN"),
    };
  };

  return (
    <div style={container}>
      <CinemaHeader
        cinemaName={cinema?.Name || cinema?.name || "Đang tải rạp..."}
        cinemaLocation={cinema?.Location || cinema?.location || ""}
        cinemaId={id}
        hideBackButton={false}
        showMovieTabs={false}
        showScheduleButton
        showSearch
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div style={content}>
        <h2 style={sectionTitle}>Lịch chiếu</h2>

        {availableDates.length > 0 && (
          <div style={dateStrip}>
            {availableDates.map((dateKey) => {
              const label = formatDateLabel(dateKey);
              const isActive = dateKey === selectedDateKey;
              const hasShowtimes = Boolean(dateHasShowtimes[dateKey]);
              const baseStyle = hasShowtimes ? dateCard : dateCardDisabled;
              return (
                <button
                  key={dateKey}
                  type="button"
                  style={isActive ? dateCardActive : baseStyle}
                  onClick={() => setSelectedDateKey(dateKey)}
                >
                  <span style={dateCardDay}>{label.day}</span>
                  <span style={dateCardDate}>{label.date}</span>
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <p style={{ color: "white", textAlign: "center", fontSize: "18px" }}>
            Đang tải lịch chiếu...
          </p>
        ) : (
          <div style={movieGrid}>
            {movies.map((movie) => (
              <div
                key={movie.id ?? movie.Id}
                style={movieCard}
                onClick={() => goToMovieDetail(movie)}
              >
                <div style={imageContainer}>
                  <img
                    src={
                      movie.posterUrl ||
                      "https://via.placeholder.com/300x450?text=Chưa+có+poster"
                    }
                    alt={movie.title}
                    style={posterImg}
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/300x450?text=Lỗi+ảnh";
                    }}
                  />
                </div>

                <div style={movieInfo}>
                  <div>
                    <h3 style={movieTitle}>
                      <span style={movieMetaLabel}>Tên phim:</span>{" "}
                      {movie.title}
                    </h3>
                    <p style={movieGenre}>
                      <span style={movieMetaLabel}>Thể loại:</span>{" "}
                      {movie.genre}
                    </p>
                    <div style={movieInfoList}>
                      <p style={movieMetaLine}>
                        <span style={movieMetaLabel}>Đạo diễn:</span>{" "}
                        {movie.director || "Chưa cập nhật"}
                      </p>
                      <p style={movieMetaLine}>
                        <span style={movieMetaLabel}>Thời lượng:</span>{" "}
                        {formatDuration(movie.duration)}
                      </p>
                    </div>
                  </div>

                  <div style={actionButtons}>
                    <button
                      style={trailerBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWatchTrailer(movie.trailerUrl);
                      }}
                    >
                      ▶️ Trailer
                    </button>
                    <button
                      style={bookBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `${API_BASE}/booking?cinemaId=${id}&movieId=${movie.id ?? movie.Id}`,
                        );
                      }}
                    >
                      🎟️ Đặt Vé
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {movies.length === 0 && !loading && (
              <p
                style={{
                  color: "white",
                  gridColumn: "1 / -1",
                  textAlign: "center",
                }}
              >
                Hiện tại chưa có bộ phim nào đang chiếu.
              </p>
            )}
          </div>
        )}
      </div>

      {selectedTrailer && (
        <div style={modalOverlay} onClick={() => setSelectedTrailer(null)}>
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={closeBtn} onClick={() => setSelectedTrailer(null)}>
              ❌ Đóng
            </button>
            <iframe
              width="100%"
              height="100%"
              src={selectedTrailer}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ borderRadius: "0 0 12px 12px" }}
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}

const container = {
  minHeight: "100vh",
  backgroundColor: "#0a0f1c",
  fontFamily: "Arial, sans-serif",
};
const content = { maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" };
const sectionTitle = {
  color: "white",
  fontSize: "28px",
  marginBottom: "24px",
  borderLeft: "5px solid #ff4d4f",
  paddingLeft: "15px",
};
const dateStrip = {
  display: "flex",
  gap: "10px",
  overflowX: "auto",
  paddingBottom: "12px",
  marginBottom: "24px",
};
const dateCard = {
  minWidth: "140px",
  padding: "12px 16px",
  borderRadius: "10px",
  background: "#3f3f46",
  color: "#f8fafc",
  border: "1px solid rgba(255,255,255,0.12)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "6px",
  cursor: "pointer",
};
const dateCardDisabled = {
  ...dateCard,
  background: "#27272a",
  color: "#a1a1aa",
  border: "1px solid rgba(255,255,255,0.08)",
};
const dateCardActive = {
  ...dateCard,
  background: "#dc2626",
  border: "1px solid rgba(255,255,255,0.2)",
  boxShadow: "0 10px 20px rgba(220,38,38,0.35)",
};
const dateCardDay = { fontSize: "16px", fontWeight: "700" };
const dateCardDate = { fontSize: "14px", fontWeight: "600" };
const movieGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "30px",
};
const movieCard = {
  backgroundColor: "#111827",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
  transition: "transform 0.3s ease",
  display: "flex",
  flexDirection: "column",
  cursor: "pointer",
};
const imageContainer = {
  position: "relative",
  width: "100%",
  paddingTop: "100%",
};
const posterImg = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
};
const movieInfo = {
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  flex: 1,
};
const movieTitle = {
  margin: "0 0 10px 0",
  color: "white",
  fontSize: "20px",
  fontWeight: "bold",
  lineHeight: "1.3",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};
const movieGenre = { margin: "0 0 20px 0", color: "#9ca3af", fontSize: "14px" };
const movieInfoList = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  marginTop: "10px",
};
const movieMetaLine = {
  margin: 0,
  color: "#cbd5e1",
  fontSize: "13px",
  lineHeight: 1.4,
};
const movieMetaLabel = { color: "#f1f5f9", fontWeight: "700" };
const actionButtons = { display: "flex", gap: "10px", marginTop: "10px" };
const bookBtn = {
  flex: 1,
  padding: "10px",
  backgroundColor: "#ff4d4f",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "background 0.2s",
};
const trailerBtn = {
  flex: 1,
  padding: "10px",
  backgroundColor: "#1f2937",
  color: "white",
  border: "1px solid #374151",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "background 0.2s",
};
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.85)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};
const modalContent = {
  width: "90%",
  maxWidth: "800px",
  height: "450px",
  backgroundColor: "#000",
  borderRadius: "12px",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
};
const closeBtn = {
  alignSelf: "flex-end",
  padding: "10px 15px",
  background: "transparent",
  border: "none",
  color: "white",
  fontSize: "16px",
  cursor: "pointer",
  fontWeight: "bold",
};
