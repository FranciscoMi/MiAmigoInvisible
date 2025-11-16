process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// ========== CARGA JSON ==========
const ruta = path.join(__dirname, '..', 'json', 'mi_amigo_invisible.json');
const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));

const { correoEnvio, clave, participantes, exclusiones } = datos;

// ========== ALGORITMO DE SORTEO ==========

function sortear(participantes, exclusiones = []) {
  const maxIntentos = 2000;

  for (let intento = 0; intento < maxIntentos; intento++) {
    const copia = [...participantes];
    const asignaciones = [];
    let valido = true;

    for (let p of participantes) {
      const opciones = copia.filter(c =>
        c.nombre !== p.nombre &&
        !exclusiones.some(([a, b]) => a === p.nombre && b === c.nombre)
      );

      if (opciones.length === 0) {
        valido = false;
        break;
      }

      const elegido = opciones[Math.floor(Math.random() * opciones.length)];
      asignaciones.push({ de: p, a: elegido });

      copia.splice(copia.indexOf(elegido), 1);
    }

    if (valido) {
      return asignaciones;
    }
  }

  throw new Error("❌ No se pudo generar un sorteo válido.");
}

// ========== CONFIGURAR MAILER ==========

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: correoEnvio, pass: clave }
});

// ========== ENVÍO DE CORREOS ==========

async function enviarCorreos(asignaciones) {

  const currentYear = new Date().getFullYear(); // año automático

  for (const { de, a } of asignaciones) {

    const mailOptions = {
      from: `"🎁 Amigo Invisible ${currentYear}" <${correoEnvio}>`,
      to: de.correo,
      subject: `🎁 Tu amigo invisible ${currentYear} es...`,
      text: `Hola ${de.nombre}!\n\nTu amigo invisible es: ${a.nombre}\n\n¡No se lo digas a nadie! 🤫`,
      html: `
      <div style="font-family: Arial, Helvetica, sans-serif; background: #f7f7f7; padding: 20px;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <h2 style="text-align: center; color: #d32f2f; margin-top: 0;">
            🎁 Amigo Invisible ${currentYear}
          </h2>

          <p style="font-size: 16px; color: #444;">
            Hola <strong>${de.nombre}</strong> 👋
          </p>

          <p style="font-size: 16px; color: #444;">
            Ya tenemos el resultado del sorteo... y tu amigo invisible es:
          </p>

          <div style="text-align: center; margin: 25px 0;">
            <div style="
              display: inline-block;
              background: #d32f2f;
              color: white;
              padding: 15px 25px;
              border-radius: 8px;
              font-size: 20px;
              font-weight: bold;
              letter-spacing: 1px;
            ">
              ${a.nombre}
            </div>
          </div>

          <p style="font-size: 15px; color: #666; text-align: center; margin-top: 10px;">
            🤫 ¡Guarda el secreto, no se lo digas a nadie!
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="font-size: 13px; color: #999; text-align: center;">
            Este mensaje ha sido enviado automáticamente por el sistema de Amigo Invisible ${currentYear}.<br>
            ¡Disfruta preparando tu regalo!
          </p>

        </div>
      </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📤 Enviado a ${de.nombre}`);
    } catch (err) {
      console.error(`❌ Error enviando a ${de.nombre}: ${err.message}`);
    }

  }
}


// ========== EJECUCIÓN ==========

try {
  const asignaciones = sortear(participantes, exclusiones);
  enviarCorreos(asignaciones);
} catch (err) {
  console.error(err.message);
}
