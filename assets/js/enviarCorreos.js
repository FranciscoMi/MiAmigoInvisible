process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Cargar datos
const ruta = path.join(__dirname, '..', 'json', 'mi_amigo_invisible.json');
const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));

const { correoEnvio, clave, participantes, exclusiones } = datos;

function sortear(participantes, exclusiones = []) {
  const maxIntentos = 1000;

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

      // Eliminar el asignado
      const index = copia.findIndex(x => x.nombre === elegido.nombre);
      copia.splice(index, 1);
    }

    if (valido) return asignaciones;
  }

  throw new Error('❌ No se pudo generar un sorteo válido. Revisa las exclusiones.');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: correoEnvio,
    pass: clave,
  },
});

async function enviarCorreos(asignaciones) {
  for (const { de, a } of asignaciones) {
    const mailOptions = {
      from: `"Mi Amigo Invisible" <${correoEnvio}>`,
      to: de.correo,
      subject: '🎁 Tu amigo invisible es...',
      text: `Hola ${de.nombre}!\n\nTu amigo invisible es: ${a.nombre}\n\n¡No se lo digas a nadie! 🤫`
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📤 Correo enviado a ${de.nombre}`);
    } catch (err) {
      console.error(`❌ Error con ${de.nombre}: ${err.message}`);
    }
  }
}

try {
  const asignaciones = sortear(participantes, exclusiones);
  enviarCorreos(asignaciones);
} catch (err) {
  console.error(err.message);
}
