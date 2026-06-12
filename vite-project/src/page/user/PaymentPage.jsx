import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const POLL_INTERVAL_MS = 3000;
const POLL_REQUEST_TIMEOUT_MS = 2500;

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = Number(searchParams.get("bookingId"));

  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [qrLoadError, setQrLoadError] = useState(false);
  const pollAbortRef = useRef(null);

  const isValidBookingId = Number.isFinite(bookingId) && bookingId > 0;

  const loadPaymentInfo = useCallback(async () => {
    if (!isValidBookingId) {
      setError("Thiếu mã đơn thanh toán hợp lệ.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/bookings/${bookingId}/payment-info`,
      );
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setPaymentInfo(data);
      setStatus(String(data?.status || "PENDING").toUpperCase());
      setRemainingSeconds(Number(data?.remainingSeconds || 0));
      setError("");
    } catch (err) {
      setError(err.message || "Không tải được thông tin thanh toán.");
    } finally {
      setLoading(false);
    }
  }, [bookingId, isValidBookingId]);

  const checkPaymentStatus = useCallback(
    async ({ showLoading = true, cancelPrevious = false } = {}) => {
      if (!isValidBookingId) {
        return;
      }

      if (cancelPrevious && pollAbortRef.current) {
        pollAbortRef.current.abort();
        pollAbortRef.current = null;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        POLL_REQUEST_TIMEOUT_MS,
      );

      if (cancelPrevious) {
        pollAbortRef.current = controller;
      }

      if (showLoading) {
        setChecking(true);
      }

      try {
        const res = await fetch(
          `${API_BASE}/api/bookings/${bookingId}/status`,
          {
            signal: controller.signal,
          },
        );
        if (!res.ok) {
          throw new Error(await res.text());
        }

        const data = await res.json();
        const status = String(data?.status || "").toUpperCase();
        const nextRemaining = Number(data?.remainingSeconds || 0);
        setStatus(status);
        setRemainingSeconds(nextRemaining);

        if (status === "PAID") {
          navigate(
            `/payment-result?status=SUCCESS&message=Thanh_toan_thanh_cong&bookingId=${bookingId}`,
            { replace: true },
          );
          return;
        }

        if (status === "CANCELLED") {
          const message =
            nextRemaining <= 0 ? "Đơn đã hết hạn thanh toán" : "Đơn đã bị hủy";
          navigate(
            `/payment-result?status=FAILED&message=${message}&bookingId=${bookingId}`,
            { replace: true },
          );
        }
      } catch (err) {
        if (err?.name === "AbortError") {
          return;
        }
        setError(err.message || "Không kiểm tra được trạng thái thanh toán.");
      } finally {
        clearTimeout(timeoutId);
        if (pollAbortRef.current === controller) {
          pollAbortRef.current = null;
        }
        if (showLoading) {
          setChecking(false);
        }
      }
    },
    [bookingId, isValidBookingId, navigate],
  );

  useEffect(() => {
    loadPaymentInfo();
  }, [loadPaymentInfo]);

  useEffect(() => {
    if (!paymentInfo) {
      return;
    }

    const status = String(paymentInfo?.status || "").toUpperCase();
    if (status === "PAID") {
      navigate(
        `/payment-result?status=SUCCESS&message=Thanh_toan_thanh_cong&bookingId=${bookingId}`,
        { replace: true },
      );
      return;
    }

    const timer = setInterval(() => {
      if (document.hidden) {
        return;
      }
      checkPaymentStatus({ showLoading: false, cancelPrevious: true });
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      if (pollAbortRef.current) {
        pollAbortRef.current.abort();
        pollAbortRef.current = null;
      }
    };
  }, [bookingId, checkPaymentStatus, navigate, paymentInfo]);

  useEffect(() => {
    if (status !== "PENDING") {
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "PENDING") {
      return;
    }
    if (remainingSeconds > 0) {
      return;
    }

    checkPaymentStatus({ showLoading: false, cancelPrevious: true });
  }, [checkPaymentStatus, remainingSeconds, status]);

  const amountText = useMemo(() => {
    const amount = Number(paymentInfo?.totalPrice || 0);
    if (!Number.isFinite(amount)) {
      return "0";
    }
    return amount.toLocaleString("vi-VN");
  }, [paymentInfo]);

  const copyText = async (value, label) => {
    try {
      await navigator.clipboard.writeText(String(value || ""));
      alert(`Đã sao chép ${label}.`);
    } catch {
      alert("Không thể sao chép. Vui lòng sao chép thủ công.");
    }
  };

  const countdownText = useMemo(() => {
    const total = Math.max(0, Number(remainingSeconds || 0));
    const minutes = Math.floor(total / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (total % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [remainingSeconds]);

  const isPending = status === "PENDING";

  if (loading) {
    return (
      <div style={container}>
        <div style={card}>Đang tải thông tin thanh toán...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={container}>
        <div style={card}>
          <h2 style={{ marginTop: 0, color: "#991b1b" }}>
            Không tải được thanh toán
          </h2>
          <p>{error}</p>
          <button style={primaryBtn} onClick={loadPaymentInfo}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={card}>
        <h1 style={{ marginTop: 0, marginBottom: 6, fontSize: 24 }}>
          Thanh toán chuyển khoản
        </h1>
        <p style={{ marginTop: 0, marginBottom: 6, color: "#334155" }}>
          Quét mã QR hoặc chuyển khoản thủ công theo thông tin bên dưới.
        </p>
        <p
          style={{
            marginTop: 0,
            marginBottom: 10,
            color: "#64748b",
            fontSize: 12,
          }}
        >
          Lưu ý: Đơn sẽ tự động hủy nếu không thanh toán trong thời gian quy định.
        </p>

        <div
          style={{
            ...countdownBox,
            ...(remainingSeconds <= 60 ? countdownUrgent : {}),
          }}
        >
          <div style={{ fontWeight: 700 }}>Thời gian giữ đơn</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 1 }}>
            {countdownText}
          </div>
          <div style={{ color: "#475569" }}>
            {isPending
              ? "Đơn sẽ tự hủy khi hết thời gian."
              : status === "PAID"
                ? "Đơn đã thanh toán thành công."
                : "Đơn đã bị hủy."}
          </div>
        </div>

        <div style={paymentBody}>
          <div style={qrPanel}>
            <div style={qrWrap}>
              {!qrLoadError ? (
                <img
                  src={paymentInfo?.qrImageUrl}
                  alt="QR thanh toán"
                  style={qrImage}
                  onError={() => setQrLoadError(true)}
                />
              ) : (
                <div style={qrErrorBox}>
                  Không tải được ảnh QR từ SePay. Bạn có thể mở trực tiếp link
                  QR bên dưới.
                </div>
              )}
            </div>

            <div style={{ marginTop: 8, textAlign: "center" }}>
              <a
                href={paymentInfo?.qrImageUrl}
                target="_blank"
                rel="noreferrer"
                style={linkBtn}
              >
                Mở QR SePay
              </a>
            </div>
          </div>

          <div style={detailPanel}>
            <div style={metaGrid}>
              <MetaRow
                label="Mã đơn"
                value={`#${paymentInfo?.bookingId || bookingId}`}
                onCopy={() =>
                  copyText(paymentInfo?.bookingId || bookingId, "mã đơn")
                }
              />
              <MetaRow
                label="Ngân hàng"
                value={paymentInfo?.bank || "TPBank"}
                onCopy={() =>
                  copyText(paymentInfo?.bank || "TPBank", "tên ngân hàng")
                }
              />
              <MetaRow
                label="Số tài khoản"
                value={paymentInfo?.account || "00000180046"}
                onCopy={() =>
                  copyText(
                    paymentInfo?.account || "00000180046",
                    "số tài khoản",
                  )
                }
              />
              <MetaRow
                label="Nội dung CK"
                value={paymentInfo?.transferContent || "TKPNBV"}
                onCopy={() =>
                  copyText(
                    paymentInfo?.transferContent || "TKPNBV",
                    "nội dung chuyển khoản",
                  )
                }
              />
              <MetaRow label="Số tiền" value={`${amountText} VND`} />
            </div>

            <div className="responsive-actions" style={actions}>
              <button
                style={primaryBtn}
                disabled={checking || !isPending}
                onClick={() =>
                  checkPaymentStatus({
                    showLoading: true,
                    cancelPrevious: true,
                  })
                }
              >
                {checking
                  ? "Đang kiểm tra..."
                  : "Tôi đã chuyển khoản, kiểm tra ngay"}
              </button>
              <button style={secondaryBtn} onClick={() => navigate("/home")}>
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value, onCopy }) {
  return (
    <div className="responsive-meta-row" style={metaRow}>
      <div style={metaLabel}>{label}</div>
      <div style={metaValue}>{value}</div>
      {onCopy && (
        <button style={copyBtn} onClick={onCopy}>
          Sao chép
        </button>
      )}
    </div>
  );
}

const container = {
  minHeight: "100dvh",
  padding: "10px",
  background:
    "radial-gradient(circle at top left, #e0f2fe 0%, #f8fafc 45%, #dbeafe 100%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const card = {
  width: "100%",
  maxWidth: 980,
  background: "#ffffff",
  border: "1px solid #bfdbfe",
  borderRadius: 14,
  padding: 14,
  maxHeight: "calc(100dvh - 20px)",
  overflowY: "auto",
  boxShadow: "0 14px 28px rgba(15, 23, 42, 0.12)",
};

const paymentBody = {
  marginTop: 10,
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "flex-start",
};

const qrPanel = {
  flex: "0 1 280px",
  width: "100%",
};

const detailPanel = {
  flex: "1 1 420px",
  minWidth: 0,
};

const metaGrid = {
  display: "grid",
  gap: 10,
  marginTop: 0,
};

const metaRow = {
  border: "1px solid #dbeafe",
  borderRadius: 10,
  background: "#f8fbff",
  padding: 10,
  display: "grid",
  gridTemplateColumns: "110px 1fr auto",
  alignItems: "center",
  gap: 10,
};

const metaLabel = {
  fontWeight: 700,
  color: "#1e293b",
};

const metaValue = {
  color: "#0f172a",
  wordBreak: "break-all",
};

const qrWrap = {
  marginTop: 16,
  display: "flex",
  justifyContent: "center",
};

const qrImage = {
  width: "min(100%, 260px)",
  borderRadius: 14,
  border: "1px solid #bfdbfe",
  background: "#fff",
  padding: 6,
};

const qrErrorBox = {
  width: "min(100%, 420px)",
  borderRadius: 12,
  border: "1px dashed #f59e0b",
  background: "#fffbeb",
  color: "#92400e",
  padding: 14,
  textAlign: "center",
};

const linkBtn = {
  display: "inline-block",
  border: "1px solid #60a5fa",
  borderRadius: 8,
  padding: "8px 12px",
  color: "#1d4ed8",
  fontWeight: 700,
  textDecoration: "none",
  background: "#eff6ff",
};

const countdownBox = {
  marginTop: 8,
  border: "1px solid #93c5fd",
  borderRadius: 12,
  background: "linear-gradient(135deg, #eff6ff, #f8fafc)",
  padding: 10,
  textAlign: "center",
};

const countdownUrgent = {
  border: "1px solid #fca5a5",
  background: "linear-gradient(135deg, #fef2f2, #fff7ed)",
  color: "#991b1b",
};

const actions = {
  marginTop: 10,
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const primaryBtn = {
  border: "none",
  borderRadius: 10,
  padding: "10px 14px",
  background: "#0c4a6e",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtn = {
  border: "1px solid #94a3b8",
  borderRadius: 10,
  padding: "10px 14px",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer",
};

const copyBtn = {
  border: "1px solid #93c5fd",
  borderRadius: 8,
  padding: "6px 10px",
  background: "#eff6ff",
  color: "#1e3a8a",
  fontWeight: 700,
  cursor: "pointer",
};
