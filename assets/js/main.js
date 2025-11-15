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
  const clave = claveEnvioInput.value.trim();

  if (!correo || !clave) {
    alert('Debes ingresar correo y clave');
    return;
  }

  localStorage.setItem('correoEnvio', correo);
  localStorage.setItem('claveEnvio', clave);

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

  document.getElementById('nombre1').value = '';
  document.getElementById('nombre2').value = '';
  actualizarSelectsExclusiones();
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

  [select1, select2].forEach(select => {
    select.innerHTML = '<option value="">-- Selecciona un participante --</option>';
  });

  participantes.forEach(p => {
    const option1 = document.createElement('option');
    const option2 = document.createElement('option');
    option1.value = option2.value = p.nombre;
    option1.textContent = option2.textContent = p.nombre;

    if (p.nombre === selected2) option1.disabled = true;
    if (p.nombre === selected1) option2.disabled = true;

    select1.appendChild(option1);
    select2.appendChild(option2);
  });

  if (selected1) select1.value = selected1;
  if (selected2) select2.value = selected2;
}

function descargarDatos() {
  const datos = {
    correoEnvio: localStorage.getItem('correoEnvio'),
    clave: localStorage.getItem('claveEnvio'),
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

  URL.revokeObjectURL(url);
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

      if (!datos.correoEnvio || !datos.clave || !Array.isArray(datos.participantes) || !Array.isArray(datos.exclusiones)) {
        throw new Error('El archivo no tiene el formato correcto');
      }

      localStorage.setItem('correoEnvio', datos.correoEnvio);
      localStorage.setItem('claveEnvio', datos.clave);

      participantes.length = 0;
      exclusiones.length = 0;

      datos.participantes.forEach(p => participantes.push(p));
      datos.exclusiones.forEach(e => exclusiones.push(e));

      actualizarListaParticipantes();
      actualizarListaExclusiones();
      actualizarSelectsExclusiones();

      correoEnvioInput.value = datos.correoEnvio;
      claveEnvioInput.value = datos.clave;

      mostrarPantalla('pantalla-participantes');

      alert('Archivo cargado correctamente. Puedes continuar editando.');
    } catch (error) {
      alert('Error al cargar el archivo JSON: ' + error.message);
    }
  };

  lector.readAsText(archivo);
}

function guardarParaEnvio(asignaciones) {
  const datos = {
    correoEnvio: localStorage.getItem('correoEnvio'),
    clave: localStorage.getItem('claveEnvio'),
    participantes: participantes.map(p => ({ nombre: p.nombre, correo: p.correo })),
    asignaciones
  };

  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = "mi_amigo_invisible.json";
  enlace.click();

  URL.revokeObjectURL(url);
}

function realizarSorteo() {
  const resultadoDiv = document.getElementById('resultado-sorteo');
  const maxIntentos = 1000;
  let intento = 0;
  let asignaciones = null;

  while (intento < maxIntentos && !asignaciones) {
    const posibles = [...participantes];
    const copia = [...participantes];
    const tempAsignaciones = [];
    let valido = true;

    for (let p of posibles) {
      const opciones = copia.filter(c =>
        c.nombre !== p.nombre &&
        !exclusiones.some(([a, b]) => a === p.nombre && b === c.nombre)
      );

      if (opciones.length === 0) {
        valido = false;
        break;
      }

      const elegido = opciones[Math.floor(Math.random() * opciones.length)];
      tempAsignaciones.push({ de: p.nombre, a: elegido.nombre });

      const index = copia.findIndex(c => c.nombre === elegido.nombre);
      copia.splice(index, 1);
    }

    if (valido && tempAsignaciones.length === participantes.length) {
      asignaciones = tempAsignaciones;
    }

    intento++;
  }

  if (!asignaciones) {
    resultadoDiv.innerHTML = `<p style="color: red;">❌ No se pudo generar un sorteo válido. Revisa las exclusiones o el número de participantes.</p>`;
    return;
  }

  resultadoDiv.innerHTML = `
    <h3>🎁 Sorteo generado con éxito</h3>
    <p>📩 Se ha generado el archivo para enviar los correos. Ejecuta el script de Node.</p>
  `;

  // Guardar en archivo JSON
  const datos = {
    correoEnvio: localStorage.getItem('correoEnvio'),
    clave: localStorage.getItem('claveEnvio'),
    participantes: participantes.map(p => ({ nombre: p.nombre, correo: p.correo })),
    asignaciones
  };

  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = "mi_amigo_invisible.json";
  enlace.click();

  URL.revokeObjectURL(url);

  alert(`📤 Correos listos para enviar. Ejecuta el script Node (enviarCorreos.js).`);
}


document.getElementById('nombre1').addEventListener('change', actualizarSelectsExclusiones);
document.getElementById('nombre2').addEventListener('change', actualizarSelectsExclusiones);
