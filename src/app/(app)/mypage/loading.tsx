export default function MypageLoading() {
  return (
    <main style={{ padding: "0 20px 100px" }}>
      <div style={{ padding: "10px 4px 14px" }}>
        <div style={{ width: "100px", height: "28px", borderRadius: "8px", background: "var(--card2)", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "18px", padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "var(--card2)", flexShrink: 0, animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: "100px", height: "18px", borderRadius: "8px", background: "var(--card2)", marginBottom: "8px", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ width: "60px", height: "13px", borderRadius: "6px", background: "var(--card2)", animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
        </div>
      </div>
      {[1, 2].map((i) => (
        <div key={i} style={{ height: "80px", borderRadius: "18px", background: "var(--card)", border: "1px solid var(--border)", marginBottom: "12px", animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
    </main>
  );
}
