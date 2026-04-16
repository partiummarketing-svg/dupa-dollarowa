export function RedButt() {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem", paddingBottom: "2rem" }}>
      <svg width="200" height="160" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="72" cy="80" rx="62" ry="70" fill="#e53e3e" />
        <ellipse cx="128" cy="80" rx="62" ry="70" fill="#c53030" />
        <path d="M100 10 Q94 80 100 150" stroke="#9b2c2c" strokeWidth="4" fill="none" strokeLinecap="round" />
        <ellipse cx="58" cy="52" rx="18" ry="22" fill="#fc8181" opacity="0.4" />
        <ellipse cx="142" cy="52" rx="18" ry="22" fill="#fc8181" opacity="0.25" />
      </svg>
    </div>
  );
}
