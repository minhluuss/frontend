import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CinemaHeader from "./CinemaHeader";
const API_BASE = import.meta.env.VITE_API_BASE_URL;
export default function CinemaPage() {
  const { id } = useParams(); // 🎯 Lấy ID rạp từ URL
  const navigate = useNavigate();

  const [cinema, setCinema] = useState(null); // State lưu thông tin rạp
  const [movies, setMovies] = useState([]); // State lưu danh sách phim
  const [allCinemaMovies, setAllCinemaMovies] = useState([]);
  const [activeMovieTab, setActiveMovieTab] = useState("NOW_SHOWING");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTrailer, setSelectedTrailer] = useState(null);

  const getId = (obj) => Number(obj?.id ?? obj?.Id ?? 0);
  const getRoomId = (obj) => Number(obj?.roomId ?? obj?.RoomId ?? 0);
  const getMovieId = (obj) => Number(obj?.movieId ?? obj?.MovieId ?? 0);
  const getStatus = (obj) =>
    (obj?.status ?? obj?.Status ?? "").toString().toUpperCase();

  useEffect(() => {
    let isMounted = true;

    // 🎯 1. Gọi API lấy thông tin rạp theo ID
    fetch(`api/cinemas/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        // Xử lý trường hợp API trả về mảng
        if (Array.isArray(data)) {
          setCinema(data[0]);
        } else {
          setCinema(data);
        }
      })
      .catch((err) => console.error("Lỗi tải rạp:", err));

    // 🎯 2. Chỉ lấy phim thuộc rạp hiện tại (thông qua phòng + suất chiếu)
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
        const showtimesInCinema = (showtimesData || []).filter((st) =>
          roomIds.has(getRoomId(st)),
        );
        const movieIdsInCinema = new Set(
          showtimesInCinema.map((st) => getMovieId(st)),
        );

        const filteredMovies = (moviesData || []).filter((m) => {
          const movieId = getId(m);
          return movieIdsInCinema.has(movieId);
        });

        setAllCinemaMovies(filteredMovies);
      })
      .catch((err) => {
        console.error("Lỗi tải phim theo rạp:", err);
        if (isMounted) {
          setAllCinemaMovies([]);
          setMovies([]);
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
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const next = allCinemaMovies.filter((m) => {
      const status = getStatus(m);

      if (status === "STOPPED") return false;

      if (activeMovieTab === "COMING_SOON") {
        if (!(status === "COMING_SOON" || status === "UPCOMING")) return false;
      } else if (status !== "NOW_SHOWING") {
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
  }, [activeMovieTab, allCinemaMovies, searchTerm]);

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
    navigate(`/cinemapage/${id}/movie/${movieId}`);
  };

  const formatDuration = (minutes) => {
    const total = Number(minutes) || 0;
    if (!total) return "Chưa cập nhật";
    return `${total} phút`;
  };


  return (
    <div style={container}>
      <CinemaHeader
        cinemaName={cinema?.Name || cinema?.name || "Đang tải rạp..."}
        cinemaLocation={cinema?.Location || cinema?.location || ""}
        cinemaId={id}
        hideBackButton={false}
        activeMovieTab={activeMovieTab}
        onMovieTabChange={setActiveMovieTab}
        showScheduleButton
        showSearch
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div style={content}>
        <h2 style={sectionTitle}>
          {activeMovieTab === "NOW_SHOWING"
            ? "Phim Đang Chiếu"
            : "Phim Sắp Chiếu"}
        </h2>

        {loading ? (
          <p style={{ color: "white", textAlign: "center", fontSize: "18px" }}>
            Đang tải danh sách phim...
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
                      <span style={movieMetaLabel}></span>{" "}
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
                          `/booking?cinemaId=${id}&movieId=${movie.id ?? movie.Id}`,
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
                {activeMovieTab === "NOW_SHOWING"
                  ? "Hiện tại chưa có bộ phim nào đang chiếu."
                  : "Hiện tại chưa có bộ phim nào sắp chiếu."}
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
  marginBottom: "30px",
  borderLeft: "5px solid #ff4d4f",
  paddingLeft: "15px",
};
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
const durationTag = {
  position: "absolute",
  bottom: "10px",
  right: "10px",
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  color: "#ffc107",
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "12px",
  fontWeight: "bold",
  border: "1px solid #ffc107",
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
