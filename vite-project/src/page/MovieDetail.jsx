import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CinemaHeader from "./CinemaHeader";

export default function MovieDetail() {
  const { id, movieId } = useParams();
  const navigate = useNavigate();

  const [cinema, setCinema] = useState(null);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrailer, setSelectedTrailer] = useState(null);

  const numericMovieId = useMemo(() => Number(movieId), [movieId]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetch(`/api/cinemas/${id}`).then((res) =>
        res.json(),
      ),
      fetch("/api/movies").then((res) => res.json()),
    ])
      .then(([cinemaData, moviesData]) => {
        if (!isMounted) return;

        const foundCinema = Array.isArray(cinemaData)
          ? cinemaData[0]
          : cinemaData;
        const foundMovie = (moviesData || []).find(
          (m) => Number(m.id ?? m.Id) === numericMovieId,
        );

        setCinema(foundCinema || null);
        setMovie(foundMovie || null);
      })
      .catch((err) => {
        console.error("Lỗi tải chi tiết phim:", err);
        if (isMounted) {
          setCinema(null);
          setMovie(null);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, numericMovieId]);

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}?autoplay=1`
      : null;
  };

  const handleWatchTrailer = () => {
    const embedUrl = getYouTubeEmbedUrl(movie?.trailerUrl);
    if (embedUrl) {
      setSelectedTrailer(embedUrl);
    } else {
      alert("Phim này hiện chưa có trailer hoặc link bị lỗi!");
    }
  };

  return (
    <div style={container}>
      <CinemaHeader
        cinemaName={cinema?.Name || cinema?.name || "Đang tải rạp..."}
        hideBackButton={false}
        showMovieTabs={false}
      />

      <div style={content}>
        {loading ? (
          <p style={loadingText}>Đang tải chi tiết phim...</p>
        ) : !movie ? (
          <p style={loadingText}>Không tìm thấy phim.</p>
        ) : (
          <div style={detailCard}>
            <div style={posterWrap}>
              <img
                src={
                  movie.posterUrl ||
                  "https://via.placeholder.com/460x640?text=Chua+co+poster"
                }
                alt={movie.title || "Phim"}
                style={posterImg}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/460x640?text=Loi+anh";
                }}
              />
            </div>

            <div style={infoWrap}>
              <h2 style={titleStyle}>
                <span style={detailLabel}></span> {movie.title || "Không rõ"}
              </h2>
              <div style={metaRow}>
                <p style={detailLine}>
                  <span style={detailLabel}>Thể loại:</span>{" "}
                  {movie.genre || "Không rõ thể loại"}
                </p>
                <p style={detailLine}>
                  <span style={detailLabel}>Thời lượng:</span>{" "}
                  {movie.duration || 0} phút
                </p>
              </div>

              <p style={directorText}>
                <span style={detailLabel}>Đạo diễn:</span>{" "}
                {movie.director || "Chưa cập nhật"}
              </p>

              <p style={descStyle}>
                <strong>Mô tả:</strong> <br/>
                {movie.description || "Phim hiện chưa có mô tả."}
              </p>

              <div style={actionRow}>
                <button style={trailerBtn} onClick={handleWatchTrailer}>
                  ▶️ Trailer
                </button>
                <button
                  style={bookBtn}
                  onClick={() =>
                    navigate(
                      `/booking?cinemaId=${id}&movieId=${movie.id ?? movie.Id}`,
                    )
                  }
                >
                  🎟️ Đặt vé
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedTrailer && (
        <div style={modalOverlay} onClick={() => setSelectedTrailer(null)}>
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={closeBtn} onClick={() => setSelectedTrailer(null)}>
              Đóng
            </button>
            <iframe
              width="100%"
              height="100%"
              src={selectedTrailer}
              title="Trailer phim"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}

const container = {
  minHeight: "100vh",
  background: "radial-gradient(circle at 20% 20%, #1f2937, #0b1120)",
  fontFamily: "Arial, sans-serif",
};

const content = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "34px 20px 50px",
};

const loadingText = { color: "#e2e8f0", textAlign: "center", fontSize: "18px" };

const detailCard = {
  display: "grid",
  gridTemplateColumns: "340px 1fr",
  gap: "28px",
  background: "rgba(17,24,39,0.95)",
  border: "1px solid rgba(148,163,184,0.24)",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 14px 30px rgba(0,0,0,0.45)",
  alignItems: "start",
};

const posterWrap = {
  width: "100%",
  borderRadius: "14px",
  overflow: "hidden",
  border: "1px solid #334155",
  alignSelf: "start",
};
const posterImg = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const infoWrap = {
  color: "#e2e8f0",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  alignItems: "flex-start",
  textAlign: "left",
};
const titleStyle = {
  margin: 0,
  fontSize: "34px",
  color: "#ffffff",
  lineHeight: 1.15,
};
const metaRow = { display: "flex", flexDirection: "column", gap: "8px" };
const detailLabel = { color: "#f1f5f9", fontWeight: "700" };
const detailLine = { margin: 0, color: "#e2e8f0" };

const directorText = { margin: 0, color: "#e2e8f0", fontWeight: "600" };
const descStyle = { margin: 0, color: "#cbd5e1", lineHeight: 1.6 };
const actionRow = {
  display: "flex",
  gap: "12px",
  marginTop: "8px",
  flexWrap: "wrap",
};

const trailerBtn = {
  padding: "12px 16px",
  borderRadius: "10px",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};

const bookBtn = {
  padding: "12px 16px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #ef4444, #f97316)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.86)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalContent = {
  width: "90%",
  maxWidth: "900px",
  height: "520px",
  background: "#000",
  borderRadius: "12px",
  overflow: "hidden",
  position: "relative",
};

const closeBtn = {
  position: "absolute",
  right: "10px",
  top: "10px",
  zIndex: 2,
  background: "rgba(15,23,42,0.9)",
  color: "white",
  border: "1px solid #334155",
  borderRadius: "8px",
  padding: "8px 12px",
  cursor: "pointer",
};
