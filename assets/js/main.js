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
    alert('Debes ingresar correo y clave');
    return;
  }

  localStorage.setItem('correoEnvio', correo);
  localStorage.setItem('claveEnvio', clave);

  mostrarPantalla('pantalla-participantes');
}

// ================== PARTICIPANTES ==================

function agregarParticipante() {
  const nombre = document.getElementById('nombre-participante').value.trim();
  const correo = document.getElementById('correo-participante').value.trim();

  if (!nombre || !correo) {
    alert('Completa los datos del participante');
    return;
  }

  participantes.push({ nombre, correo });
  actualizarListaParticipantes();

  document.getElementById('nombre-participante').value = '';
  document.getElementById('correo-participante').value = '';
}

function actualizarListaParticipantes() {
  listaParticipantes.innerHTML = participantes
    .map((p, i) => `
      <div class="item-participante">
        <span>${p.nombre} - ${p.correo}</span>
        <button onclick="eliminarParticipante(${i})" class="btn-eliminar">❌</button>
      </div>`)
    .join('');

  localStorage.setItem('participantes', JSON.stringify(participantes));
}

function eliminarParticipante(index) {
  if (confirm(`¿Eliminar a ${participantes[index].nombre}?`)) {
    participantes.splice(index, 1);
    actualizarListaParticipantes();
    actualizarSelectsExclusiones();
  }
}

function avanzarAExclusiones() {
  if (participantes.length < 2) {
    alert('Debe haber al menos 2 participantes');
    return;
  }

  actualizarSelectsExclusiones();
  mostrarPantalla('pantalla-exclusiones');
}

// ================== EXCLUSIONES ==================

function agregarExclusion() {
  const nombre1 = document.getElementById('nombre1').value;
  const nombre2 = document.getElementById('nombre2').value;

  if (!nombre1 || !nombre2) {
    alert('Selecciona ambos nombres');
    return;
  }

  if (nombre1 === nombre2) {
    alert('Una persona no puede excluirse a sí misma');
    return;
  }

  const yaExiste = exclusiones.some(([a, b]) => a === nombre1 && b === nombre2);
  if (yaExiste) {
    alert('Esa exclusión ya existe');
    return;
  }

  exclusiones.push([nombre1, nombre2]);
  actualizarListaExclusiones();
  actualizarSelectsExclusiones();
}

function actualizarListaExclusiones() {
  listaExclusiones.innerHTML = exclusiones
    .map((e, i) => `
      <div class="item-exclusion">
        <span>${e[0]} ❌ ${e[1]}</span>
        <button onclick="eliminarExclusion(${i})" class="btn-eliminar">❌</button>
      </div>`)
    .join('');

  localStorage.setItem('exclusiones', JSON.stringify(exclusiones));
}

function eliminarExclusion(index) {
  if (confirm(`¿Eliminar la exclusión ${exclusiones[index][0]} ❌ ${exclusiones[index][1]}?`)) {
    exclusiones.splice(index, 1);
    actualizarListaExclusiones();
  }
}

function actualizarSelectsExclusiones() {
  const select1 = document.getElementById('nombre1');
  const select2 = document.getElementById('nombre2');

  const selected1 = select1.value;
  const selected2 = select2.value;

  [select1, select2].forEach(s => {
    s.innerHTML = '<option value="">-- Selecciona un participante --</option>';
  });

  participantes.forEach(p => {
    const o1 = document.createElement('option');
    const o2 = document.createElement('option');
    o1.value = o2.value = p.nombre;
    o1.textContent = o2.textContent = p.nombre;

    if (p.nombre === selected2) o1.disabled = true;
    if (p.nombre === selected1) o2.disabled = true;

    select1.appendChild(o1);
    select2.appendChild(o2);
  });

  if (selected1) select1.value = selected1;
  if (selected2) select2.value = selected2;
}

// ================== GENERAR JSON ==================

function realizarSorteo() {
  if (participantes.length < 2) {
    alert("Debe haber al menos dos participantes.");
    return;
  }

  // Solo validamos que *puede* existir un sorteo válido
  if (!esSorteoPosible()) {
    alert("❌ No es posible generar un sorteo válido con esas exclusiones.");
    return;
  }

  const datos = {
    correoEnvio: localStorage.getItem('correoEnvio'),
    clave: localStorage.getItem('claveEnvio'),
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

  alert("📄 Archivo creado. Ahora ejecuta el script de Node (enviarCorreos.js).");
}

// ================== VALIDACIÓN DE VIABILIDAD ==================

function esSorteoPosible() {
  // Intento rápido con barajado
  const max = 500;

  for (let i = 0; i < max; i++) {
    const copia = [...participantes];
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
      copia.splice(copia.indexOf(elegido), 1);
    }

    if (valido) return true;
  }

  return false;
}

document.getElementById('nombre1').addEventListener('change', actualizarSelectsExclusiones);
document.getElementById('nombre2').addEventListener('change', actualizarSelectsExclusiones);
