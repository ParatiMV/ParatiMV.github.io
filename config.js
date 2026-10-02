// ============ CONFIGURACIÓN CENTRAL: edita solo este archivo ============
const CONFIG = {
  name: "Carmen",
  password: "4ever",          // se compara sin mayúsculas/minúsculas
  passwordHint: "",                       // pista opcional si se equivoca
  artistImage: "assets/artist.jpg",       // TU FOTO (reemplazar)
  finalVideo: "assets/final-video.mp4",   // EL VÍDEO del perrito (reemplazar)
  music: "",                              // p. ej. "assets/music.mp3" (opcional)
  colors: { bg: "#0a0c14", text: "#f4efe9", warm: "#f0b985", rose: "#e8a3b8", blue: "#8db3ea" },

  // Tu mensaje: separa párrafos con una línea en blanco.
  personalMessage: `[ESCRIBIR AQUÍ MI MENSAJE PERSONAL]`,

  texts: {
    installKicker: "Antes de empezar…",
    install: ["Quiero que esto lo tengas como algo tuyo.", "Instálalo en tu móvil y vuelve desde ahí."],
    almost: ["Casi.", "Ahora ábrela desde la aplicación que acabas de instalar 💞"],
    gate: ["Esto es para ti.", "Pero primero tienes que entrar."],
    intro: ["Vale.", "Aquí no hay nada que contestar,", "ni nada que hacer…", "solo cosas que te suenan."],
    universe: "Toca lo que reconozcas.",
    eggs: "Y algunas cosas que solo entendemos nosotros.",
    fakeEnd: ["Eso era todo.", "Bueno… casi."],
    artistTitle: "EL ARTISTA",
    artTitle: "EL ARTE",
    final: "Feliz cumpleaños, Carmen 💞"
  },

  // El universo de Carmen (callbacks reales del chat; cambia/añade lo que quieras)
  universe: [
    { emoji: "🍓", text: "Besis de fresi." },
    { emoji: "🍦", text: "Siempre hay sitio para un helado." },
    { emoji: "🦄", text: "Me siento unicornio." },
    { emoji: "🛡️", text: "¿Has visto Spider-Man?" },
    { emoji: "🎮", text: "Estoy jugando Brawl Stars, ¿sabes cuál es?" },
    { emoji: "📱", text: "Un TikTok más. Y otro." },
    { emoji: "🌊", text: "Aquí sí hay solecito." },
    { emoji: "🍄", text: "Seta" },
    { emoji: "🎶", text: "Romeo Santos, muy tú." }
  ],

  // Easter eggs. "note" = contexto opcional (déjalo vacío si no lo necesitas).
  easterEggs: [
    { phrase: "Besis de fresi 🍓", note: "" },
    { phrase: "Relaja la raja", note: "" },
    { phrase: "5 años más tarde", note: "" },
    { phrase: "Memoria de pez 🐟", note: "" },
    { phrase: "¿Qué me copias?", note: "" },
    { phrase: "Sin personalidad", note: "" },
    { phrase: "Dis que novios", note: "" },
    { phrase: "Yo soy el jefe", note: "" },
    { phrase: "Ñiñiñiñiñi", note: "" },
    { phrase: "Eso no es de Dios", note: "" },
    { phrase: "Gané en la vida", note: "" },
    { phrase: "Te comoooo", note: "" }
  ]
};
