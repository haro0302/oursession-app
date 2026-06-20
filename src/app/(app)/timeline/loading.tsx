export default function TimelineLoading() {
  return (
    <main style={{ padding: "0 20px 100px" }}>
      <div style={{ padding: "10px 4px 14px" }}>
        <div style={{ width: "120px", height: "28px", borderRadius: "8px", background: "var(--card2)", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "18px",
            padding: "16px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--card2)", flexShrink: 0, animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: "80px", height: "14px", borderRadius: "6px", background: "var(--card2)", marginBottom: "6px", animation: "pulse 1.5s ease-in-out infinite" }} />
              <div style={{ width: "120px", height: "12px", borderRadius: "6px", background: "var(--card2)", animation: "pulse 1.5s ease-in-out infinite" }} />
            </div>
          </div>
          <div style={{ height: "56px", borderRadius: "12px", background: "var(--card2)", marginBottom: "10px", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ width: "60%", height: "12px", borderRadius: "6px", background: "var(--card2)", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
    </main>
  );
}
