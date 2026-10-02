// ============ CONFIGURACIÓN CENTRAL: edita solo este archivo ============
const CONFIG = {
  name: "Carmen",
  password: "4ever",          // se compara sin mayúsculas/minúsculas
  passwordHint: "Nooo, que boba...",                       // pista opcional si se equivoca
  artistImage: "artist.jpg",       // TU FOTO (reemplazar)
  finalVideo: "final-video.mp4",   // EL VÍDEO del perrito (reemplazar)
  music: "music.mp3",                              // p. ej. "assets/music.mp3" (opcional)
  colors: { bg: "#0a0c14", text: "#f4efe9", warm: "#f0b985", rose: "#e8a3b8", blue: "#8db3ea" },

  // Tu mensaje: separa párrafos con una línea en blanco.
  personalMessage: `Carmen quería hacerte algo diferente y después de darle bastantes vueltas terminé haciendo todo esto porque no quería que fuese simplemente un mensaje más entre todos los que vas a recibir hoy y aunque no sepa muy bien cómo explicar todo lo que hemos vivido sí sé que hay muchísimas cosas que cuando las veo automáticamente me recuerdan a ti las fresas el helado tus besis de fresi nuestras tonterías nuestras frases y todas esas cosas que probablemente para cualquier otra persona no significarían nada pero que nosotros reconocemos al instante hemos pasado por muchísimas cosas y aunque las cosas hayan cambiado con el tiempo eso no hace que todos esos momentos dejen de existir ni que dejen de formar parte de nuestra historia así que quería dejarte algo que pudieras descubrir poco a poco y que al menos durante un rato te sacara una sonrisa no sé qué más decir sin terminar haciendo esto demasiado largo JAJAJ pero espero que disfrutes de todo lo que preparé para ti y que este pequeño regalo se quede como uno de esos recuerdos que cuando lo vuelvas a ver algún día te haga pensar en todas nuestras tonterías y sonreír`,

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
    { emoji: "🍓", text: "Fresas." },
    { emoji: "🍦", text: "Te encantan los helados." },
    { emoji: "🦄", text: "Me siento unicornio." },
    { emoji: "🛡️", text: "Marvel." },
    { emoji: "🎮", text: "Brawl Stars." },
    { emoji: "📱", text: "Un TikTok más. Y otro." },
    { emoji: "🌊", text: "Aquí sí hay solecito." },
    { emoji: "🍄", text: "Seta." },
    { emoji: "🎶", text: "Romeo Santos." }
  ],

  // Easter eggs. "note" = contexto opcional (déjalo vacío si no lo necesitas).
  easterEggs: [
    { phrase: "Besis de fresi 🍓", note: "" },
    { phrase: "Relaja la raja", note: "" },
    { phrase: "5 años más tarde", note: "" },
    { phrase: "Memoria de pez 🐟", note: "" },
    { phrase: "Qué me copias", note: "" },
    { phrase: "Sin personalidad", note: "" },
    { phrase: "Dis que novios", note: "" },
    { phrase: "Yo mando", note: "" },
    { phrase: "Ñiñiñiñiñi", note: "" },
    { phrase: "Eso no es de Dios", note: "" },
    { phrase: "Gané en la vida", note: "" },
    { phrase: "Te comoooo", note: "" }
  ]
};
