process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

/* ================================
   CIFRAR / DESCIFRAR
================================ */
function descifrar(cifrado, claveSecreta) {
  const texto = Buffer.from(cifrado, 'base64').toString();
  const xor = texto.split('').map((c, i) =>
    c.charCodeAt(0) ^ claveSecreta.charCodeAt(i % claveSecreta.length)
  );
  return String.fromCharCode(...xor);
}

const CLAVE_SECRETA = "mi_amigo_invisible_2025";
const currentYear = new Date().getFullYear();

/* ================================
   LEER JSON
================================ */
const ruta = path.join(__dirname, '../json/mi_amigo_invisible.json');

if (!fs.existsSync(ruta)) {
  console.error("❌ No existe mi_amigo_invisible.json en assets/json/");
  process.exit(1);
}

const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));

if (!Array.isArray(datos.asignaciones)) {
  console.error("❌ ERROR: El JSON no contiene 'asignaciones'.");
  process.exit(1);
}

const correoEnvio = datos.correoEnvio;
const claveDescifrada = descifrar(datos.clave, CLAVE_SECRETA);
const asignaciones = datos.asignaciones;

/* ================================
   CONFIGURAR SMTP GMAIL
================================ */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: correoEnvio,
    pass: claveDescifrada
  },
  tls: {
    // 💥 IMPORTANTE PARA EVITAR EL ERROR DE CERTIFICADO
    rejectUnauthorized: false
  }
});


/* ================================
   ENVÍO DE CORREOS
================================ */
async function enviarCorreos() {
  for (const asign of asignaciones) {

    const mailOptions = {
      from: `"🎁 Amigo Invisible ${currentYear}" <${correoEnvio}>`,
      to: asign.correoDe,
      subject: `🎁 Tu amigo invisible ${currentYear} es...`,
      html: `
      <div style="font-family: Arial, Helvetica, sans-serif; background: #f7f7f7; padding: 20px;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <h2 style="text-align: center; color: #d32f2f; margin-top: 0;">
            🎁 Amigo Invisible ${currentYear}
          </h2>

          <p style="font-size: 16px; color: #444;">
            Hola <strong>${asign.de}</strong> 👋
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
              ${asign.a}
            </div>
          </div>

          <p style="font-size: 15px; color: #666; text-align: center; margin-top: 10px;">
            🤫 ¡Guarda el secreto, no se lo digas a nadie!
          </p>
        </div>
      </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`📤 Enviado a ${asign.de} (${asign.correoDe})`);
    } catch (e) {
      console.log(`❌ Error enviando a ${asign.de}:`, e.message);
    }
  }

  console.log("🎉 Todos los correos han sido enviados.");
}

enviarCorreos();
