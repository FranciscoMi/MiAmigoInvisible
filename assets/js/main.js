// ================= Cifrado =================

const CLAVE_SECRETA = "mi_amigo_invisible_2025";

function cifrar(texto) {
  const xor = texto.split("").map((c, i) =>
    c.charCodeAt(0) ^ CLAVE_SECRETA.charCodeAt(i % CLAVE_SECRETA.length)
  );
  return btoa(String.fromCharCode(...xor));
}

// ================== ELEMENTOS ==================

const correoEnvioInput = document.getElementById('correo-envio');
const claveEnvioInput = document.getElementById('clave-envio');
const listaParticipantes = document.getElementById('lista-participantes');
const listaExclusiones = document.getElementById('lista-exclusiones');

const participantes = [];
const exclusiones = [];

// ================== NAVEGACIÓN ==================

function mostrarPantalla(id) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('visible'));
  document.getElementById(id).classList.add('visible');
}

function guardarCorreoYAvanzar() {
  const correo = correoEnvioInput.value.trim();
  const clave = claveEnvioInput.value.trim();

  if (!correo || !clave) {
    return alert("Debes ingresar correo y clave");
  }

  localStorage.setItem("correoEnvio", correo);
  localStorage.setItem("claveEnvio", clave);

  mostrarPantalla("pantalla-participantes");
}

// ================== PARTICIPANTES ==================

function agregarParticipante() {
  const nombre = document.getElementById('nombre-participante').value.trim();
  const correo = document.getElementById('correo-participante').value.trim();

  if (!nombre || !correo) return alert("Completa todos los datos");

  participantes.push({ nombre, correo });
  actualizarListaParticipantes();

  document.getElementById('nombre-participante').value = "";
  document.getElementById('correo-participante').value = "";
}

function actualizarListaParticipantes() {
  listaParticipantes.innerHTML = participantes.map((p, i) => `
    <div class="item-participante">
      <span>${p.nombre} - ${p.correo}</span>
      <button onclick="eliminarParticipante(${i})" class="btn-eliminar">❌</button>
    </div>
  `).join('');
}

function eliminarParticipante(i) {
  participantes.splice(i, 1);
  actualizarListaParticipantes();
  actualizarSelectsExclusiones();
}

function avanzarAExclusiones() {
  if (participantes.length < 2)
    return alert("Debe haber al menos 2 participantes.");

  actualizarSelectsExclusiones();
  mostrarPantalla("pantalla-exclusiones");
}

// ================== EXCLUSIONES ==================

function agregarExclusion() {
  const nombre1 = document.getElementById('nombre1').value;
  const nombre2 = document.getElementById('nombre2').value;

  if (!nombre1 || !nombre2) return alert("Selecciona ambos nombres");
  if (nombre1 === nombre2) return alert("No puede excluirse a sí mismo");

  if (exclusiones.some(([a, b]) => a === nombre1 && b === nombre2))
    return alert("Esa exclusión ya existe");

  exclusiones.push([nombre1, nombre2]);
  actualizarListaExclusiones();
  actualizarSelectsExclusiones();
}

function actualizarListaExclusiones() {
  listaExclusiones.innerHTML = exclusiones.map((e, i) => `
    <div class="item-exclusion">
      <span>${e[0]} ❌ ${e[1]}</span>
      <button onclick="eliminarExclusion(${i})" class="btn-eliminar">❌</button>
    </div>
  `).join('');
}

function eliminarExclusion(i) {
  exclusiones.splice(i, 1);
  actualizarListaExclusiones();
}

function actualizarSelectsExclusiones() {
  const select1 = document.getElementById('nombre1');
  const select2 = document.getElementById('nombre2');

  const selected1 = select1.value;
  const selected2 = select2.value;

  select1.innerHTML = '<option value="">-- Selecciona un participante --</option>';
  select2.innerHTML = '<option value="">-- Selecciona un participante --</option>';

  participantes.forEach(p => {
    const o1 = new Option(p.nombre, p.nombre);
    const o2 = new Option(p.nombre, p.nombre);

    if (p.nombre === selected2) o1.disabled = true;
    if (p.nombre === selected1) o2.disabled = true;

    select1.appendChild(o1);
    select2.appendChild(o2);
  });

  if (selected1) select1.value = selected1;
  if (selected2) select2.value = selected2;
}

// ================== CARGAR JSON ==================

function cargarDesdeArchivo() {
  const archivo = document.getElementById("archivo-json").files[0];

  if (!archivo) return alert("No has seleccionado ningún archivo");

  const lector = new FileReader();
  lector.onload = (e) => {
    try {
      const datos = JSON.parse(e.target.result);

      participantes.length = 0;
      exclusiones.length = 0;

      datos.participantes.forEach(p => participantes.push(p));
      datos.exclusiones.forEach(e => exclusiones.push(e));

      actualizarListaParticipantes();
      actualizarListaExclusiones();

      mostrarPantalla("pantalla-participantes");
      alert("Archivo cargado correctamente");

    } catch (err) {
      alert("Archivo JSON no válido");
    }
  };

  lector.readAsText(archivo);
}

// ================== SORTEO REAL ==================

function generarSorteo() {
  const intentosMax = 300;
  let intento = 0;

  while (intento < intentosMax) {
    let disponibles = [...participantes];
    const resultado = [];

    let valido = true;

    for (let p of participantes) {
      const opciones = disponibles.filter(d =>
        d.nombre !== p.nombre &&
        !exclusiones.some(([a, b]) => a === p.nombre && b === d.nombre)
      );

      if (opciones.length === 0) {
        valido = false;
        break;
      }

      const elegido = opciones[Math.floor(Math.random() * opciones.length)];

      resultado.push({
        de: p.nombre,
        correoDe: p.correo,
        a: elegido.nombre
      });

      disponibles = disponibles.filter(x => x.nombre !== elegido.nombre);
    }

    if (valido) return resultado;
    intento++;
  }

  return null;
}

// ================== GUARDAR JSON FINAL ==================

function guardarJSON() {
  const datos = {
    correoEnvio: localStorage.getItem('correoEnvio'),
    clave: cifrar(localStorage.getItem('claveEnvio')),
    participantes,
    exclusiones
  };

  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = "mi_amigo_invisible.json";
  enlace.click();

  URL.revokeObjectURL(url);

  alert("📄 Datos guardados correctamente.");
}


function realizarSorteo() {
  const asignaciones = generarSorteo();

  if (!asignaciones) {
    alert("❌ No se pudo generar un sorteo válido. Ajusta las exclusiones.");
    return;
  }

  const datos = {
    correoEnvio: localStorage.getItem('correoEnvio'),
    clave: cifrar(localStorage.getItem('claveEnvio')),
    participantes,
    exclusiones,
    asignaciones
  };

  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = "mi_amigo_invisible.json";
  enlace.click();
  URL.revokeObjectURL(url);

  alert("🎉 Sorteo generado y guardado.\nAhora ejecuta enviarCorreos.js");
}

// ================== EVENTOS ==================

document.getElementById('nombre1').addEventListener('change', actualizarSelectsExclusiones);
document.getElementById('nombre2').addEventListener('change', actualizarSelectsExclusiones);
