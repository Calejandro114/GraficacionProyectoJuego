let jugadorX = 400;
let jugadorY = 400;
let velocidad = 4;
let mirandoHacia = "derecha";

let vidas = 3;
let puntaje = 0;
let tiempoRestante = 40;
let juegoTerminado = false;
let juegoPausado = false;

let escalaVertical = 1;
let inflando = false;

let anguloAla = 0;
let subiendoAla = true;

let poderFuegoActivo = false;
let tiempoPoderFuego = 0;

let escudoActivo = false;
let tiempoEscudo = 0;

let listaItems = [];
let limiteItemsEnPantalla = 2;
let segundosTranscurridos = 0;
let yaAumentoItems = false;

let particulasPolvo = [];
let textosFlotantes = [];

// tiempo que dura inmune tras recibir un golpe
let tiempoInvencible = 0;

// los 3 bloques que no se pueden atravesar
let cajas = [
  { posicionX: 180, posicionY: 180, ancho: 90, alto: 90 },
  { posicionX: 530, posicionY: 180, ancho: 90, alto: 90 },
  { posicionX: 350, posicionY: 450, ancho: 100, alto: 70 }
];

let murcielagos = [
  { posicionX: 120, posicionY: 320, velocidadX: 3 },
  { posicionX: 680, posicionY: 600, velocidadX: -3 }
];

let listaDulces = [];
let anguloGiroDulce = 0;
let relojNuevoDulce = 0;

function setup() {
  createCanvas(800, 800);
  rellenarItems();
  agregarNuevoDulce();
}

function draw() {
  if (tiempoInvencible > 0) {
    tiempoInvencible--;
  }

  if (juegoTerminado) {
    mostrarPantallaGameOver();
    return;
  }

  background(35, 40, 50);

  if (juegoPausado) {
    dibujarCajasObstaculos();
    dibujarItems();
    dibujarMurcielagosEstaticos();
    for (let i = 0; i < listaDulces.length; i++) {
      let d = listaDulces[i];
      dibujarDulce(d.posicionX, d.posicionY, anguloGiroDulce, d.radio);
    }
    dibujarJugador(jugadorX, jugadorY, mirandoHacia);
    dibujarMarcador();
    mostrarCuadroPausa();
    return;
  }

  // contador de tiempo normal (60 frames son 1 segundo)
  if (frameCount % 60 === 0) {
    segundosTranscurridos++;
    if (tiempoRestante > 0) {
      tiempoRestante--;
      if (tiempoRestante <= 0) {
        juegoTerminado = true;
      }
    }

    if (segundosTranscurridos >= 40 && !yaAumentoItems) {
      limiteItemsEnPantalla = 3;
      yaAumentoItems = true;
      agregarTextoFlotante("¡MÁS ÍTEMS EN EL MAPA!", width / 2, height / 2, [255, 220, 0]);
    }
  }

  rellenarItems();

  // cada 40 seg sale otro dulce
  relojNuevoDulce++;
  if (relojNuevoDulce >= 2400) {
    agregarNuevoDulce();
    relojNuevoDulce = 0;
    agregarTextoFlotante("¡NUEVO DULCE!", width / 2, height / 2 + 30, [255, 60, 60]);
  }

  if (poderFuegoActivo) {
    tiempoPoderFuego--;
    if (tiempoPoderFuego <= 0) {
      poderFuegoActivo = false;
    }
  }

  if (escudoActivo) {
    tiempoEscudo--;
    if (tiempoEscudo <= 0) {
      escudoActivo = false;
    }
  }

  if (inflando) {
    escalaVertical += 0.02;
    if (escalaVertical >= 1.15) inflando = false;
  } else {
    escalaVertical -= 0.02;
    if (escalaVertical <= 0.85) inflando = true;
  }

  if (subiendoAla) {
    anguloAla += 1.5;
    if (anguloAla >= 15) subiendoAla = false;
  } else {
    anguloAla -= 1.5;
    if (anguloAla <= -15) subiendoAla = true;
  }

  anguloGiroDulce += 0.06;

  actualizarParticulas();
  dibujarCajasObstaculos();
  controlarItems();
  controlarMurcielagos();
  controlarDulces();
  moverJugador();
  dibujarJugador(jugadorX, jugadorY, mirandoHacia);
  actualizarTextosFlotantes();
  dibujarMarcador();

  if (vidas <= 0) {
    juegoTerminado = true;
  }
}

// para que nada aparezca dentro de las cajas ni encima del jugador
function obtenerPosicionSegura(radioMargen, distanciaMinimaJugador) {
  let posicionValida = false;
  let intentoX = 0;
  let intentoY = 0;

  while (!posicionValida) {
    intentoX = random(60, width - 60);
    intentoY = random(60, height - 60);
    let esInseguro = false;

    for (let i = 0; i < cajas.length; i++) {
      let caja = cajas[i];
      if (
        intentoX + radioMargen > caja.posicionX &&
        intentoX - radioMargen < caja.posicionX + caja.ancho &&
        intentoY + radioMargen > caja.posicionY &&
        intentoY - radioMargen < caja.posicionY + caja.alto
      ) {
        esInseguro = true;
        break;
      }
    }

    if (distanciaMinimaJugador > 0) {
      let distAlSlime = dist(intentoX, intentoY, jugadorX, jugadorY);
      if (distAlSlime < distanciaMinimaJugador) {
        esInseguro = true;
      }
    }

    if (!esInseguro) {
      posicionValida = true;
    }
  }

  return { x: intentoX, y: intentoY };
}

function agregarNuevoDulce() {
  let posicion = obtenerPosicionSegura(40, 180);
  let nuevoDulce = {
    posicionX: posicion.x,
    posicionY: posicion.y,
    radio: 20,
    velocidad: 2.6
  };
  listaDulces.push(nuevoDulce);
}

function controlarDulces() {
  for (let i = 0; i < listaDulces.length; i++) {
    let dulce = listaDulces[i];

    let distanciaX = jugadorX - dulce.posicionX;
    let distanciaY = jugadorY - dulce.posicionY;
    let distanciaTotal = dist(jugadorX, jugadorY, dulce.posicionX, dulce.posicionY);

    if (distanciaTotal > 0) {
      dulce.posicionX += (distanciaX / distanciaTotal) * dulce.velocidad;
      dulce.posicionY += (distanciaY / distanciaTotal) * dulce.velocidad;
    }

    dibujarDulce(dulce.posicionX, dulce.posicionY, anguloGiroDulce, dulce.radio);

    if (distanciaTotal < dulce.radio + 22) {
      if (!escudoActivo && !poderFuegoActivo && tiempoInvencible === 0) {
        vidas--;
        tiempoInvencible = 60;
        agregarTextoFlotante("-1 VIDA", jugadorX, jugadorY, [255, 60, 60]);
      }
      let nuevaPos = obtenerPosicionSegura(dulce.radio + 20, 180);
      dulce.posicionX = nuevaPos.x;
      dulce.posicionY = nuevaPos.y;
    }
  }
}

function dibujarDulce(posX, posY, angulo, radio) {
  push();
  translate(posX, posY);
  rotate(angulo);

  stroke(0);
  strokeWeight(2);
  fill(255);
  ellipse(0, 0, radio * 2, radio * 2);

  noStroke();
  fill(220, 30, 30);
  let totalPuntas = 8;
  for (let i = 0; i < totalPuntas; i++) {
    rotate(TWO_PI / totalPuntas);
    triangle(0, 0, radio, -6, radio, 6);
  }

  stroke(0);
  strokeWeight(2);
  noFill();
  ellipse(0, 0, radio * 2, radio * 2);

  pop();
}

function dibujarJugador(posicionX, posicionY, direccion) {
  push();
  translate(posicionX, posicionY);

  if (poderFuegoActivo) {
    noStroke();
    fill(255, 100, 0, 100);
    ellipse(0, 0, 70, 70);
  }

  if (escudoActivo) {
    stroke(80, 220, 255);
    strokeWeight(3);
    fill(0, 180, 255, 75);
    ellipse(0, 0, 74, 74);
  }

  stroke(0);
  strokeWeight(3);

  // si recibio golpe parpadea en rojo y blanco
  if (tiempoInvencible > 0) {
    if (frameCount % 8 < 4) {
      fill(255, 80, 80);
    } else {
      fill(255, 230, 230);
    }
  } else if (poderFuegoActivo) {
    fill(235, 70, 70);
  } else {
    fill(50, 205, 50);
  }
  ellipse(0, 0, 55, 48 * escalaVertical);

  fill(0);
  noStroke();

  let ojoX1 = -8;
  let ojoX2 = 8;
  let ojoY = -4;

  if (direccion === "izquierda") {
    ojoX1 = -16;
    ojoX2 = -4;
  } else if (direccion === "derecha") {
    ojoX1 = 4;
    ojoX2 = 16;
  } else if (direccion === "arriba") {
    ojoY = -12;
  } else if (direccion === "abajo") {
    ojoY = 6;
  }

  ellipse(ojoX1, ojoY, 7, 7);
  ellipse(ojoX2, ojoY, 7, 7);

  stroke(0);
  strokeWeight(2);
  line(ojoX1 + 2, ojoY + 9, ojoX2 - 2, ojoY + 9);

  pop();
}

function agregarParticula(posX, posY) {
  let nuevaParticula = {
    x: posX + random(-8, 8),
    y: posY + 18,
    tamano: random(8, 14),
    opacidad: 180
  };
  particulasPolvo.push(nuevaParticula);
}

function actualizarParticulas() {
  noStroke();
  for (let i = particulasPolvo.length - 1; i >= 0; i--) {
    let p = particulasPolvo[i];
    
    if (escudoActivo) {
      fill(80, 220, 255, p.opacidad);
    } else if (poderFuegoActivo) {
      fill(255, 120, 0, p.opacidad);
    } else {
      fill(180, 190, 200, p.opacidad);
    }

    ellipse(p.x, p.y, p.tamano, p.tamano);

    p.opacidad -= 6;
    p.tamano -= 0.2;

    if (p.opacidad <= 0 || p.tamano <= 0) {
      particulasPolvo.splice(i, 1);
    }
  }
}

function agregarTextoFlotante(texto, posX, posY, colorTexto) {
  let nuevoTexto = {
    mensaje: texto,
    x: posX,
    y: posY,
    opacidad: 255,
    color: colorTexto
  };
  textosFlotantes.push(nuevoTexto);
}

function actualizarTextosFlotantes() {
  textAlign(CENTER, CENTER);
  textSize(20);
  strokeWeight(2);

  for (let i = textosFlotantes.length - 1; i >= 0; i--) {
    let t = textosFlotantes[i];

    stroke(0, t.opacidad);
    fill(t.color[0], t.color[1], t.color[2], t.opacidad);
    text(t.mensaje, t.x, t.y);

    t.y -= 1.2;
    t.opacidad -= 5;

    if (t.opacidad <= 0) {
      textosFlotantes.splice(i, 1);
    }
  }
}

function controlarMurcielagos() {
  for (let indice = 0; indice < murcielagos.length; indice++) {
    let murcielago = murcielagos[indice];

    murcielago.posicionX += murcielago.velocidadX;

    if (murcielago.posicionX < 50 || murcielago.posicionX > width - 50) {
      murcielago.velocidadX = murcielago.velocidadX * -1;
    }

    dibujarMurcielago(murcielago.posicionX, murcielago.posicionY, anguloAla);

    let distancia = dist(jugadorX, jugadorY, murcielago.posicionX, murcielago.posicionY);
    if (distancia < 32) {
      if (!escudoActivo && !poderFuegoActivo && tiempoInvencible === 0) {
        vidas--;
        tiempoInvencible = 60;
        murcielago.velocidadX *= -1;
        agregarTextoFlotante("-1 VIDA", jugadorX, jugadorY, [255, 60, 60]);
      }
    }
  }
}

function dibujarMurcielagosEstaticos() {
  for (let indice = 0; indice < murcielagos.length; indice++) {
    let murcielago = murcielagos[indice];
    dibujarMurcielago(murcielago.posicionX, murcielago.posicionY, 0);
  }
}

function dibujarMurcielago(posX, posY, inclinacionAla) {
  push();
  translate(posX, posY);

  stroke(0);
  strokeWeight(2);
  fill(80, 50, 40);

  triangle(-12, 0, -32, -10 + inclinacionAla, -20, 12);
  triangle(12, 0, 32, -10 + inclinacionAla, 20, 12);

  triangle(-8, -10, -14, -20, -2, -12);
  triangle(8, -10, 14, -20, 2, -12);

  ellipse(0, 0, 26, 22);
  fill(255, 0, 0);
  noStroke();
  ellipse(-5, -2, 4, 4);
  ellipse(5, -2, 4, 4);

  pop();
}

// aqui se mueve en diagonales si dejas presionadas dos flechas
function moverJugador() {
  let velocidadActual = velocidad;
  if (poderFuegoActivo) {
    velocidadActual = velocidad * 1.6;
  }

  let siguienteX = jugadorX;
  let siguienteY = jugadorY;

  let seMovio = false;
  let seMovioArriba = false;
  let seMovioAbajo = false;
  let seMovioIzquierda = false;
  let seMovioDerecha = false;

  if (keyIsDown(UP_ARROW)) {
    siguienteY -= velocidadActual;
    seMovioArriba = true;
    seMovio = true;
  }
  if (keyIsDown(DOWN_ARROW)) {
    siguienteY += velocidadActual;
    seMovioAbajo = true;
    seMovio = true;
  }
  if (keyIsDown(LEFT_ARROW)) {
    siguienteX -= velocidadActual;
    seMovioIzquierda = true;
    seMovio = true;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    siguienteX += velocidadActual;
    seMovioDerecha = true;
    seMovio = true;
  }

  if (seMovio && frameCount % 3 === 0) {
    agregarParticula(jugadorX, jugadorY);
  }

  if (seMovioIzquierda) {
    mirandoHacia = "izquierda";
  } else if (seMovioDerecha) {
    mirandoHacia = "derecha";
  } else if (seMovioArriba) {
    mirandoHacia = "arriba";
  } else if (seMovioAbajo) {
    mirandoHacia = "abajo";
  }

  let radioSlime = 24;

  let chocaHorizontal = false;
  for (let indice = 0; indice < cajas.length; indice++) {
    let caja = cajas[indice];
    if (
      siguienteX + radioSlime > caja.posicionX &&
      siguienteX - radioSlime < caja.posicionX + caja.ancho &&
      jugadorY + radioSlime > caja.posicionY &&
      jugadorY - radioSlime < caja.posicionY + caja.alto
    ) {
      chocaHorizontal = true;
    }
  }
  if (siguienteX < 30 || siguienteX > width - 30) chocaHorizontal = true;
  if (!chocaHorizontal) jugadorX = siguienteX;

  let chocaVertical = false;
  for (let indice = 0; indice < cajas.length; indice++) {
    let caja = cajas[indice];
    if (
      jugadorX + radioSlime > caja.posicionX &&
      jugadorX - radioSlime < caja.posicionX + caja.ancho &&
      siguienteY + radioSlime > caja.posicionY &&
      siguienteY - radioSlime < caja.posicionY + caja.alto
    ) {
      chocaVertical = true;
    }
  }
  if (siguienteY < 30 || siguienteY > height - 30) chocaVertical = true;
  if (!chocaVertical) jugadorY = siguienteY;
}

function dibujarCajasObstaculos() {
  for (let indice = 0; indice < cajas.length; indice++) {
    let caja = cajas[indice];

    stroke(50, 25, 10);
    strokeWeight(3);
    fill(140, 85, 45);
    rect(caja.posicionX, caja.posicionY, caja.ancho, caja.alto);

    stroke(80, 45, 20);
    strokeWeight(2);
    line(caja.posicionX, caja.posicionY + caja.alto / 2, caja.posicionX + caja.ancho, caja.posicionY + caja.alto / 2);
    line(caja.posicionX + caja.ancho / 3, caja.posicionY, caja.posicionX + caja.ancho / 3, caja.posicionY + caja.alto);
    line(caja.posicionX + (caja.ancho * 2) / 3, caja.posicionY, caja.posicionX + (caja.ancho * 2) / 3, caja.posicionY + caja.alto);
  }
}

function rellenarItems() {
  while (listaItems.length < limiteItemsEnPantalla) {
    let suerte = random(100);
    let itemElegido = {};

    // el corazon sale menos que los demas
    if (suerte < 8) {
      itemElegido = { icono: "💖", efecto: "vidaExtra" };
    } else if (suerte < 23) {
      itemElegido = { icono: "🛡️", efecto: "escudo" };
    } else if (suerte < 43) {
      itemElegido = { icono: "🔥", efecto: "fuego" };
    } else if (suerte < 63) {
      itemElegido = { icono: "⏳", efecto: "masTiempo" };
    } else if (suerte < 80) {
      itemElegido = { icono: "💀", efecto: "menosTiempo" };
    } else {
      itemElegido = { icono: "💎", efecto: "puntos" };
    }

    let posicionSegura = obtenerPosicionSegura(30, 140);

    listaItems.push({
      icono: itemElegido.icono,
      efecto: itemElegido.efecto,
      posicionX: posicionSegura.x,
      posicionY: posicionSegura.y,
      tiempoVida: 420
    });
  }
}

function controlarItems() {
  dibujarItems();

  for (let i = listaItems.length - 1; i >= 0; i--) {
    let item = listaItems[i];

    item.tiempoVida--;

    if (item.tiempoVida <= 0) {
      listaItems.splice(i, 1);
      continue;
    }

    let distancia = dist(jugadorX, jugadorY, item.posicionX, item.posicionY);

    if (distancia < 35) {
      if (item.efecto === "puntos") {
        puntaje += 100;
        agregarTextoFlotante("+100", item.posicionX, item.posicionY, [100, 220, 255]);
      }
      if (item.efecto === "masTiempo") {
        tiempoRestante += 8;
        agregarTextoFlotante("+8s", item.posicionX, item.posicionY, [100, 255, 120]);
      }
      if (item.efecto === "menosTiempo") {
        tiempoRestante = max(0, tiempoRestante - 6);
        agregarTextoFlotante("-6s", item.posicionX, item.posicionY, [255, 80, 80]);
      }
      if (item.efecto === "fuego") {
        poderFuegoActivo = true;
        tiempoPoderFuego = 360;
        agregarTextoFlotante("¡FUEGO!", item.posicionX, item.posicionY, [255, 140, 20]);
      }
      if (item.efecto === "vidaExtra") {
        vidas++;
        agregarTextoFlotante("+1 VIDA", item.posicionX, item.posicionY, [255, 105, 180]);
      }
      if (item.efecto === "escudo") {
        escudoActivo = true;
        tiempoEscudo = 240;
        agregarTextoFlotante("¡ESCUDO!", item.posicionX, item.posicionY, [80, 220, 255]);
      }

      listaItems.splice(i, 1);
    }
  }
}

function dibujarItems() {
  textAlign(CENTER, CENTER);
  textSize(34);

  for (let i = 0; i < listaItems.length; i++) {
    let item = listaItems[i];

    // parpadea cuando le queda poco tiempo
    if (item.tiempoVida < 120) {
      if (frameCount % 10 < 5) {
        continue;
      }
    }

    text(item.icono, item.posicionX, item.posicionY);
  }
}

function mostrarCuadroPausa() {
  stroke(255);
  strokeWeight(2);
  fill(0, 0, 0, 210);
  rectMode(CENTER);
  rect(width / 2, height / 2, 420, 180, 10);
  rectMode(CORNER);

  noStroke();
  textAlign(CENTER, CENTER);
  fill(255, 200, 0);
  textSize(30);
  text("JUEGO PAUSADO", width / 2, height / 2 - 25);

  fill(255);
  textSize(18);
  text("Presiona \"P\" para continuar", width / 2, height / 2 + 30);
}

function dibujarMarcador() {
  fill(15, 23, 42, 220);
  noStroke();
  rect(15, 15, 240, 115, 10);

  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text("💎 Puntaje: " + puntaje, 28, 24);
  text("❤️ Vidas: " + vidas, 28, 46);
  text("⏳ Tiempo: " + tiempoRestante + "s", 28, 68);

  if (poderFuegoActivo) {
    fill(255, 100, 0);
    textSize(13);
    let segFuego = Math.ceil(tiempoPoderFuego / 60);
    text("🔥 ¡FUEGO! (" + segFuego + "s)", 28, 90);
  }

  if (escudoActivo) {
    fill(80, 220, 255);
    textSize(13);
    let segEscudo = Math.ceil(tiempoEscudo / 60);
    let offsetY = poderFuegoActivo ? 106 : 90;
    text("🛡️ ¡ESCUDO! (" + segEscudo + "s)", 28, offsetY);
  }
}

function mostrarPantallaGameOver() {
  background(20, 25, 35);
  textAlign(CENTER, CENTER);

  fill(240, 70, 70);
  textSize(50);
  text("GAME OVER", width / 2, height / 2 - 50);

  fill(255);
  textSize(22);
  text("Puntaje conseguido: " + puntaje, width / 2, height / 2 + 10);

  fill(180);
  textSize(18);
  text("Presiona la barra de ESPACIO para jugar otra vez", width / 2, height / 2 + 70);
}

function keyPressed() {
  // pausar con la P
  if (key === 'p' || key === 'P') {
    if (!juegoTerminado) {
      juegoPausado = !juegoPausado;
    }
  }

  // Segun gemini el keyCode 32 es la tecla espacio Sirve para volver a jugar
  if (juegoTerminado && keyCode === 32) {
    vidas = 3;
    puntaje = 0;
    tiempoRestante = 40;
    segundosTranscurridos = 0;
    limiteItemsEnPantalla = 2;
    yaAumentoItems = false;
    poderFuegoActivo = false;
    escudoActivo = false;
    tiempoEscudo = 0;
    tiempoInvencible = 0;
    jugadorX = 400;
    jugadorY = 400;
    mirandoHacia = "derecha";
    juegoTerminado = false;
    juegoPausado = false;
    particulasPolvo = [];
    textosFlotantes = [];
    listaItems = [];
    listaDulces = [];
    relojNuevoDulce = 0;
    rellenarItems();
    agregarNuevoDulce();
  }
}