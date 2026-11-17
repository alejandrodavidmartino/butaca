// Ratatús: la mascota de Butaca. Una rata que vive debajo de las butacas del cine
// y ha visto todas las películas desde el suelo. Dibujada en SVG y animada con CSS.
//
// mood: 'idle' (parpadea y mueve la cola) | 'thinking' (mira a los lados, salen "?")
//       | 'happy' (salta, ojos contentos)
export default function Ratatus({ mood = 'idle', className = '', title = 'Ratatús, la mascota de Butaca' }) {
  return (
    <svg
      viewBox="0 0 200 230"
      className={`ratatus ratatus--${mood} ${className}`}
      role="img"
      aria-label={title}
    >
      {/* Cola */}
      <path className="ratatus-tail" d="M140 190 C185 192 195 150 172 136 C160 129 150 140 158 148"
        fill="none" stroke="#e79aab" strokeWidth="7" strokeLinecap="round" />

      <g className="ratatus-body">
        {/* Pies */}
        <ellipse cx="74" cy="214" rx="17" ry="8" fill="#e79aab" />
        <ellipse cx="126" cy="214" rx="17" ry="8" fill="#e79aab" />

        {/* Cuerpo y barriga */}
        <ellipse cx="100" cy="168" rx="54" ry="48" fill="#868b99" />
        <ellipse cx="100" cy="178" rx="36" ry="32" fill="#c8cbd5" />

        {/* Orejas (detrás de la cabeza) */}
        <circle cx="50" cy="50" r="31" fill="#868b99" />
        <circle cx="50" cy="50" r="20" fill="#f3b3c1" />
        <circle cx="150" cy="50" r="31" fill="#868b99" />
        <circle cx="150" cy="50" r="20" fill="#f3b3c1" />

        {/* Cabeza */}
        <ellipse cx="100" cy="92" rx="52" ry="45" fill="#979cab" />
        {/* Mechón de pelo */}
        <path d="M92 50 Q96 36 104 46 Q108 34 113 48" fill="none" stroke="#868b99" strokeWidth="5" strokeLinecap="round" />

        {/* Mofletes */}
        <circle cx="66" cy="110" r="9" fill="#f3b3c1" opacity=".6" />
        <circle cx="134" cy="110" r="9" fill="#f3b3c1" opacity=".6" />

        {/* Ojos normales */}
        <g className="ratatus-eyes">
          <circle cx="80" cy="86" r="13" fill="#fff" />
          <circle cx="120" cy="86" r="13" fill="#fff" />
          <g className="ratatus-pupils">
            <circle cx="81" cy="88" r="7" fill="#15131a" />
            <circle cx="121" cy="88" r="7" fill="#15131a" />
            <circle cx="83.5" cy="85" r="2.4" fill="#fff" />
            <circle cx="123.5" cy="85" r="2.4" fill="#fff" />
          </g>
          {/* Párpados (para parpadear) */}
          <g className="ratatus-lids">
            <ellipse cx="80" cy="86" rx="14" ry="14" fill="#979cab" />
            <ellipse cx="120" cy="86" rx="14" ry="14" fill="#979cab" />
          </g>
        </g>
        {/* Ojos contentos ^ ^ */}
        <g className="ratatus-happy-eyes" fill="none" stroke="#15131a" strokeWidth="4" strokeLinecap="round">
          <path d="M70 90 Q80 78 90 90" />
          <path d="M110 90 Q120 78 130 90" />
        </g>

        {/* Hocico, nariz, boca y dientes */}
        <ellipse cx="100" cy="114" rx="19" ry="14" fill="#c8cbd5" />
        <ellipse cx="100" cy="105" rx="8" ry="5.5" fill="#e0607a" />
        <path d="M91 118 Q100 127 109 118" fill="none" stroke="#3a3542" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="96" y="121" width="3.6" height="6" rx="1" fill="#fff" />
        <rect x="100.4" y="121" width="3.6" height="6" rx="1" fill="#fff" />

        {/* Bigotes */}
        <g stroke="#5b5f6b" strokeWidth="1.8" strokeLinecap="round">
          <path d="M80 110 L50 104" /><path d="M80 115 L48 116" /><path d="M81 120 L52 128" />
          <path d="M120 110 L150 104" /><path d="M120 115 L152 116" /><path d="M119 120 L148 128" />
        </g>

        {/* Cubo de palomitas con los colores de Butaca */}
        <g className="ratatus-popcorn">
          {[[82, 150, 9], [94, 145, 10], [107, 146, 10], [119, 151, 9], [88, 156, 8], [113, 157, 8], [100, 152, 9]].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill={i % 2 ? '#fff4d1' : '#fde8a8'} stroke="#e9c86a" strokeWidth="1" />
          ))}
          <path d="M76 158 L124 158 L117 204 L83 204 Z" fill="#fff" />
          <path d="M84 158 L92 158 L90 204 L86 204 Z M100 158 L108 158 L104 204 L99 204 Z M116 158 L124 158 L118 204 L114 204 Z" fill="#c81e3a" />
          <path d="M76 158 L124 158" stroke="#a5122b" strokeWidth="3" />
        </g>
        {/* Bracitos sujetando el cubo */}
        <ellipse cx="72" cy="176" rx="10" ry="14" fill="#868b99" transform="rotate(-20 72 176)" />
        <ellipse cx="128" cy="176" rx="10" ry="14" fill="#868b99" transform="rotate(20 128 176)" />
      </g>

      {/* Interrogaciones al pensar */}
      <g className="ratatus-question" fill="#c81e3a" fontFamily="Bebas Neue, sans-serif" fontSize="34">
        <text x="160" y="30">?</text>
        <text x="178" y="58" fontSize="24">?</text>
      </g>
    </svg>
  );
}
