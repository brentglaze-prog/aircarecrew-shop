import { ImageResponse } from "next/og";

export const alt = "AirCareCrew.shop — Gear for the Crew";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #0a0b0d 0%, #111318 58%, #0b2235 100%)",
          color: "#f7f8fa",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: 9999,
            right: -110,
            top: -150,
            background: "rgba(109, 50, 150, 0.22)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 430,
            height: 430,
            borderRadius: 9999,
            right: 120,
            bottom: -230,
            background: "rgba(0, 166, 214, 0.16)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 760,
            padding: "72px 0 70px 76px",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              border: "2px solid rgba(152, 221, 239, 0.42)",
              borderRadius: 9999,
              padding: "10px 18px",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 2.4,
              color: "#d9f2f9",
            }}
          >
            AIR MEDICAL • HEMS • CREW APPAREL
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginTop: 32,
              fontSize: 72,
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: -3,
            }}
          >
            <span>AirCare</span>
            <span style={{ color: "#cdb3de" }}>Crew</span>
            <span style={{ color: "#98ddef" }}>.shop</span>
          </div>

          <div
            style={{
              marginTop: 30,
              fontSize: 42,
              lineHeight: 1.12,
              fontWeight: 700,
              letterSpacing: -1,
            }}
          >
            Gear for the Crew.
          </div>

          <div
            style={{
              marginTop: 16,
              maxWidth: 620,
              fontSize: 25,
              lineHeight: 1.35,
              color: "#d9f2f9",
            }}
          >
            Independent apparel and gear for air medical and HEMS crews.
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 42,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 1.2,
              color: "#98ddef",
            }}
          >
            AIRCARECREW.SHOP
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 440,
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 340,
              height: 340,
              borderRadius: 9999,
              border: "2px solid rgba(152, 221, 239, 0.32)",
              background: "rgba(10, 11, 13, 0.58)",
            }}
          >
            <svg width="280" height="280" viewBox="0 0 280 280" fill="none">
              <circle cx="140" cy="140" r="122" stroke="#8246af" strokeWidth="5" opacity="0.8" />
              <line x1="58" y1="58" x2="222" y2="222" stroke="#8246af" strokeWidth="9" strokeLinecap="round" />
              <line x1="222" y1="58" x2="58" y2="222" stroke="#38b8df" strokeWidth="9" strokeLinecap="round" />
              <rect x="116" y="72" width="48" height="118" rx="24" fill="#f7f8fa" />
              <rect x="135" y="181" width="10" height="63" rx="5" fill="#f7f8fa" />
              <rect x="104" y="234" width="72" height="8" rx="4" fill="#f7f8fa" />
              <circle cx="140" cy="140" r="11" fill="#f7f8fa" />
            </svg>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
