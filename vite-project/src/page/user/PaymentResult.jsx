import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PaymentResult() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const status = (params.get("status") || "FAILED").toUpperCase();
  const message =
    params.get("message") || "Không xác định được kết quả thanh toán.";
  const bookingId = params.get("bookingId");

  const mode = useMemo(() => {
    if (status === "SUCCESS") return "success";
    if (status === "PROCESSING") return "processing";
    if (status === "CANCELLED") return "cancelled";
    return "failed";
  }, [status]);

  return (
    <div style={container}>
      <div style={card}>
        <h1
          style={{
            marginTop: 0,
            color:
              mode === "success"
                ? "#166534"
                : mode === "processing"
                  ? "#1d4ed8"
                  : mode === "cancelled"
                    ? "#9a3412"
                    : "#991b1b",
          }}
        >
          {mode === "success"
            ? "Thanh toán thành công"
            : mode === "processing"
              ? "Đang chờ xác nhận"
              : mode === "cancelled"
                ? "Đã hủy thanh toán"
                : "Thanh toán thất bại"}
        </h1>

        <p style={{ color: "#334155", lineHeight: 1.6, marginBottom: 8 }}>
          {decodeMessage(message)}
        </p>

        {bookingId && <p style={{ marginTop: 0 }}>Mã đơn: #{bookingId}</p>}

        <div style={actions}>
          <button style={primaryBtn} onClick={() => navigate("/home")}>
            Về trang chủ
          </button>
          <button style={secondaryBtn} onClick={() => navigate(-1)}>
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}

function decodeMessage(message) {
  try {
    return decodeURIComponent(message).replaceAll("_", " ");
  } catch {
    return message.replaceAll("_", " ");
  }
}

const container = {
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px",
  background: "linear-gradient(140deg, #f8fafc, #e2e8f0)",
};

const card = {
  width: "100%",
  maxWidth: 460,
  background: "#ffffff",
  borderRadius: 14,
  border: "1px solid #cbd5e1",
  boxShadow: "0 14px 24px rgba(15,23,42,0.12)",
  padding: 18,
};

const actions = {
  marginTop: 14,
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const primaryBtn = {
  border: "none",
  borderRadius: 10,
  padding: "10px 14px",
  background: "#0f766e",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const secondaryBtn = {
  border: "1px solid #94a3b8",
  borderRadius: 10,
  padding: "10px 14px",
  background: "#fff",
  color: "#0f172a",
  fontWeight: "bold",
  cursor: "pointer",
};
