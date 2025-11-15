const correoEnvioInput = document.getElementById('correo-envio');
const claveEnvioInput = document.getElementById('clave-envio');
const listaParticipantes = document.getElementById('lista-participantes');
const listaExclusiones = document.getElementById('lista-exclusiones');

const participantes = [];
const exclusiones = [];

function mostrarPantalla(id) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('visible'));
  document.getElementById(id).classList.add('visible');
}

function guardarCorreoYAvanzar() {
  const correo = correoEnvioInput.value.trim();
  const clave = claveEnvioInput.value.trim(); // No se guarda

  if (!correo || !clave) {
    alert('Debes ingresar correo y clave');
    return;
  }

  localStorage.setItem('correoEnvio', correo);
  mostrarPantalla('pantalla-participantes');
}

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
      </div>
    `)
    .join('');

  localStorage.setItem('participantes', JSON.stringify(participantes));
}

function actualizarListaExclusiones() {
  listaExclusiones.innerHTML = exclusiones
    .map((e, i) => `
      <div class="item-exclusion">
        <span>${e[0]} ❌ ${e[1]}</span>
        <button onclick="eliminarExclusion(${i})" class="btn-eliminar">❌</button>
      </div>
    `)
    .join('');
    
  localStorage.setItem('exclusiones', JSON.stringify(exclusiones));
}


function eliminarParticipante(index) {
  if (confirm(`¿Eliminar a ${participantes[index].nombre}?`)) {
    participantes.splice(index, 1);
    actualizarListaParticipantes();
    actualizarSelectsExclusiones(); // actualiza los selects por si ya están en uso
  }
}

function eliminarExclusion(index) {
  if (confirm(`¿Eliminar la exclusión ${exclusiones[index][0]} ❌ ${exclusiones[index][1]}?`)) {
    exclusiones.splice(index, 1);
    actualizarListaExclusiones();
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

  // Verificar si ya existe la exclusión
  const yaExiste = exclusiones.some(([a, b]) => a === nombre1 && b === nombre2);
  if (yaExiste) {
    alert('Esa exclusión ya existe');
    return;
  }

  exclusiones.push([nombre1, nombre2]);
  actualizarListaExclusiones();

  document.getElementById('nombre1').value = '';
  document.getElementById('nombre2').value = '';
  actualizarSelectsExclusiones();
}


function actualizarSelectsExclusiones() {
  const select1 = document.getElementById('nombre1');
  const select2 = document.getElementById('nombre2');

  // Obtener la selección actual (si hay) para mantenerla tras la actualización
  const selected1 = select1.value;
  const selected2 = select2.value;

  // Limpiar selects
  [select1, select2].forEach(select => {
    select.innerHTML = '<option value="">-- Selecciona un participante --</option>';
  });

  participantes.forEach(p => {
    const option1 = document.createElement('option');
    const option2 = document.createElement('option');
    option1.value = option2.value = p.nombre;
    option1.textContent = option2.textContent = p.nombre;

    // Evita que se elija la misma persona en ambos selects
    if (p.nombre === selected2) option1.disabled = true;
    if (p.nombre === selected1) option2.disabled = true;

    select1.appendChild(option1);
    select2.appendChild(option2);
  });

  // Restaura selección previa
  if (selected1) select1.value = selected1;
  if (selected2) select2.value = selected2;
}

function descargarDatos() {
  const datos = {
    correoEnvio: localStorage.getItem('correoEnvio'),
    participantes,
    exclusiones
  };

  const jsonString = JSON.stringify(datos, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = "mi_amigo_invisible.json";
  enlace.click();

  URL.revokeObjectURL(url); // Liberar memoria
}

function cargarDesdeArchivo() {
  const input = document.getElementById('archivo-json');
  const archivo = input.files[0];

  if (!archivo) {
    alert('No se seleccionó ningún archivo');
    return;
  }

  const lector = new FileReader();

  lector.onload = function (e) {
    try {
      const datos = JSON.parse(e.target.result);

      if (!datos.correoEnvio || !Array.isArray(datos.participantes) || !Array.isArray(datos.exclusiones)) {
        throw new Error('El archivo no tiene el formato correcto');
      }

      localStorage.setItem('correoEnvio', datos.correoEnvio);

      // Vaciar los arrays actuales
      participantes.length = 0;
      exclusiones.length = 0;

      // Cargar los datos
      datos.participantes.forEach(p => participantes.push(p));
      datos.exclusiones.forEach(e => exclusiones.push(e));

      actualizarListaParticipantes();
      actualizarListaExclusiones();
      actualizarSelectsExclusiones();

      // Mostrar la siguiente pantalla automáticamente
      correoEnvioInput.value = datos.correoEnvio;
      mostrarPantalla('pantalla-participantes');

      alert('Archivo cargado correctamente. Puedes continuar editando.');
    } catch (error) {
      alert('Error al cargar el archivo JSON: ' + error.message);
    }
  };

  lector.readAsText(archivo);
}


document.getElementById('nombre1').addEventListener('change', actualizarSelectsExclusiones);
document.getElementById('nombre2').addEventListener('change', actualizarSelectsExclusiones);

