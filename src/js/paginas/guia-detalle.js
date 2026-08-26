import { obtenerPlanIA } from '../servicios/ia.service.js';
import { obtenerPlanesUsuarioBD } from '../servicios/planes.service.js';
import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';

import {
  completarPaso,
  completarTareaLocal,
  estaPasoCompletado,
  estaTareaCompletada,
  obtenerPasosCompletados,
  todosLosPasosCompletados
} from '../utilidades/progreso-tareas.js';

let temporizador = null;
let segundosRestantes = 25 * 60;
let modoPomodoro = 'Trabajo';

let tarjetasRecall = [];
let tarjetaActual = 0;

let planGuiaActual = null;


/* =========================================================
   INICIO
========================================================= */

document.addEventListener('DOMContentLoaded', async () => {

  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('plan_id');

  let tareaActual = null;

  if (planId) {
    try {
      tareaActual = await cargarPlanPersistente(planId);
    } catch (error) {
      console.error('Error cargando plan:', error);
      mostrarNota(`No se pudo cargar el plan: ${error.message}`);
    }
  }

  if (tareaActual) {

    establecerTexto(
      'plan-titulo',
      tareaActual.nombre || tareaActual.titulo,
      'Plan de Estudio'
    );

    establecerTexto(
      'plan-descripcion',
      tareaActual.descripcion
    );

    establecerTexto(
      'plan-objetivo',
      tareaActual.objetivo
    );

    const pasos = obtenerPasos(tareaActual);

    planGuiaActual = {
      plan: tareaActual,
      pasos
    };

    const fechaEntrega =
      tareaActual.fecha_entrega ||
      tareaActual.fecha_fin ||
      tareaActual.fecha ||
      pasos.find(paso => paso.fecha)?.fecha;

    establecerTexto(
      'plan-inicio',
      tareaActual.fecha_inicio ||
      tareaActual.inicio ||
      tareaActual.fecha_creacion,
      'No disponible',
      true
    );

    establecerTexto(
      'plan-entrega',
      fechaEntrega,
      'No disponible',
      true
    );

    establecerTexto(
      'plan-estado',
      tareaActual.estado || 'En progreso'
    );

    const metodo = tareaActual.metodo_estudio;

    establecerTexto(
      'metodo-actual-nombre',
      metodo
    );

    const cajaMetodo = document.querySelector('.plan-metodo-box');

    if (cajaMetodo) {
      cajaMetodo.hidden = !metodo;
    }

    /* ---------------------------------------------
       RENDER DE PASOS
    --------------------------------------------- */

    const contenedorPasos =
      document.getElementById('lista-pasos-container');

    if (contenedorPasos) {

      if (pasos.length === 0) {

        contenedorPasos.innerHTML = `
          <p class="plan-no-disponible">
            Este plan no contiene pasos.
          </p>
        `;

      } else {

        contenedorPasos.innerHTML = pasos
          .map((paso, index) =>
            renderizarActividad(
              paso,
              index,
              planId,
              pasos.length
            )
          )
          .join('');

        configurarBotonesPasos(
          planId,
          pasos.length
        );

        actualizarProgresoPasos(
          planId,
          pasos.length
        );
      }
    }

    /* ---------------------------------------------
       BOTÓN FINAL
    --------------------------------------------- */

    configurarCompletarTarea(
      tareaActual,
      planId,
      pasos.length
    );

    actualizarResumenActividades(pasos);
  }

  inicializarMetodos(tareaActual);

  document
    .getElementById('btn-cambiar-metodo')
    ?.addEventListener('click', () => {
      document
        .getElementById('selector-metodo')
        ?.focus();
    });

  document
    .getElementById('btn-modo-rayo')
    ?.addEventListener('click', () => {

      cambiarMetodo('pomodoro', true);
      iniciarPomodoro();

    });

});


/* =========================================================
   OBTENER PASOS
========================================================= */

function obtenerPasos(plan) {

  if (!plan) {
    return [];
  }

  const posiblesPasos =
    plan.pasos ||
    plan.actividades ||
    plan.fases ||
    plan.tareas ||
    [];

  if (!Array.isArray(posiblesPasos)) {
    return [];
  }

  return posiblesPasos.slice(0, 5);
}


/* =========================================================
   CARGAR PLAN
========================================================= */

async function cargarPlanPersistente(planId) {

  const usuario = await obtenerUsuarioActual();

  let planPersistente = null;

  if (usuario?.id) {

    const planes =
      await obtenerPlanesUsuarioBD(usuario.id);

    planPersistente =
      planes.find(
        item => String(item.id) === String(planId)
      ) || null;
  }

  try {

    const respuesta =
      await obtenerPlanIA(planId);

    const planIA =
      extraerPlanIA(respuesta);

    if (!planPersistente) {
      return planIA;
    }

    return {

      ...planPersistente,

      ...planIA,

      actividades:
        planIA?.pasos ||
        planIA?.actividades ||
        planIA?.fases ||
        planIA?.tareas ||
        planPersistente.actividades,

      pasos:
        planIA?.pasos ||
        planIA?.actividades ||
        planIA?.fases ||
        planIA?.tareas ||
        planPersistente.actividades

    };

  } catch (error) {

    console.warn(
      'No se pudo obtener el plan de IA. Se utilizará el plan guardado.',
      error
    );

    if (planPersistente) {
      return planPersistente;
    }

    throw error;
  }
}


/* =========================================================
   EXTRAER PLAN IA
========================================================= */

function extraerPlanIA(respuesta) {

  if (
    !respuesta ||
    typeof respuesta !== 'object'
  ) {
    return null;
  }

  return (
    respuesta.data?.plan ||
    respuesta.plan ||
    respuesta.data ||
    respuesta
  );
}


/* =========================================================
   RENDER DE CADA PASO
========================================================= */

function renderizarActividad(
  actividad,
  indice,
  planId,
  totalPasos
) {

  const numeroPaso = indice + 1;

  const completado =
    estaPasoCompletado(
      planId,
      numeroPaso
    );

  const disponible =
    !completado &&
    (
      numeroPaso === 1 ||
      estaPasoCompletado(
        planId,
        numeroPaso - 1
      )
    );

  const titulo =
    escapar(
      actividad?.titulo ||
      actividad?.nombre ||
      `Paso ${numeroPaso}`
    );

  const contenido =
    actividad?.descripcion ||
    actividad?.contenido ||
    actividad?.detalle ||
    '';

  const duracion =
    actividad?.duracion ??
    actividad?.duracion_minutos;

  const fecha =
    actividad?.fecha;

  const subpasos =
    actividad?.subpasos ||
    actividad?.sub_steps ||
    actividad?.actividades ||
    [];

  let boton = '';

  if (completado) {

    boton = `
      <div class="paso-mensaje paso-completado">
        ✓ Paso completado
      </div>
    `;

  } else if (disponible) {

    boton = `
      <button
        type="button"
        class="btn-confirmar-paso"
        data-paso="${numeroPaso}">
        ✓ Confirmar paso
      </button>
    `;

  } else {

    boton = `
      <div class="paso-mensaje paso-bloqueado">
        🔒 Completa el paso anterior
      </div>
    `;
  }

  const listaSubpasos =
    Array.isArray(subpasos) &&
    subpasos.length
      ? `
        <div class="plan-checklist">
          ${subpasos
            .map(subpaso => `
              <span>
                ${escapar(
                  subpaso?.titulo ||
                  subpaso?.nombre ||
                  subpaso?.contenido ||
                  subpaso
                )}
              </span>
            `)
            .join('')}
        </div>
      `
      : '';

  return `
    <article
      class="paso-ia
      ${completado
        ? 'completado'
        : disponible
          ? 'disponible'
          : 'bloqueado'}">

      <div class="actividad-cabecera">

        <div>

          <span class="actividad-numero">

            ${
              completado
                ? '✓'
                : disponible
                  ? numeroPaso
                  : '🔒'
            }

          </span>

          <div>

            <p class="paso-etiqueta">
              PASO ${numeroPaso} DE ${totalPasos}
            </p>

            <h3>
              ${titulo}
            </h3>

          </div>

        </div>

        <span class="actividad-estado">

          ${
            completado
              ? '✓ Completado'
              : disponible
                ? 'Disponible'
                : 'Bloqueado'
          }

        </span>

      </div>

      ${
        contenido
          ? `<p>${escapar(contenido)}</p>`
          : '<p>Sin descripción disponible.</p>'
      }

      <div class="actividad-datos">

        ${
          fecha
            ? `<span>
                Fecha: ${escapar(fecha)}
              </span>`
            : ''
        }

        ${
          duracion != null
            ? `<span>
                Duración: ${escapar(duracion)} min
              </span>`
            : ''
        }

      </div>

      ${listaSubpasos}

      ${boton}

    </article>
  `;
}


/* =========================================================
   BOTONES DE PASOS
========================================================= */

function configurarBotonesPasos(
  planId,
  totalPasos
) {

  document
    .querySelectorAll('.btn-confirmar-paso')
    .forEach(boton => {

      boton.addEventListener(
        'click',
        () => {

          const numeroPaso =
            Number(boton.dataset.paso);

          /* Seguridad adicional */
          if (
            !planId ||
            !numeroPaso ||
            numeroPaso < 1 ||
            numeroPaso > totalPasos
          ) {
            return;
          }

          /* No permitir saltarse pasos */
          if (
            numeroPaso > 1 &&
            !estaPasoCompletado(
              planId,
              numeroPaso - 1
            )
          ) {
            return;
          }

          /* Evitar doble clic */
          boton.disabled = true;
          boton.textContent = 'Guardando...';

          const completado =
            completarPaso(
              planId,
              numeroPaso
            );

          if (!completado) {

            boton.disabled = false;
            boton.textContent =
              '✓ Confirmar paso';

            return;
          }

          /* -----------------------------------------
             VOLVER A RENDERIZAR
          ----------------------------------------- */

          renderizarTodosLosPasos(
            planId,
            totalPasos
          );

        }
      );

    });
}


/* =========================================================
   RENDERIZAR TODOS LOS PASOS
========================================================= */

function renderizarTodosLosPasos(
  planId,
  totalPasos
) {

  const contenedor =
    document.getElementById(
      'lista-pasos-container'
    );

  const plan =
    planGuiaActual;

  if (
    !contenedor ||
    !plan ||
    !Array.isArray(plan.pasos)
  ) {
    return;
  }

  contenedor.innerHTML =
    plan.pasos
      .map((paso, index) =>
        renderizarActividad(
          paso,
          index,
          planId,
          totalPasos
        )
      )
      .join('');

  configurarBotonesPasos(
    planId,
    totalPasos
  );

  actualizarProgresoPasos(
    planId,
    totalPasos
  );

  configurarCompletarTarea(
    plan.plan,
    planId,
    totalPasos
  );

  actualizarResumenActividades(
    plan.pasos
  );
}


/* =========================================================
   PROGRESO
========================================================= */

function actualizarProgresoPasos(
  planId,
  totalPasos
) {

  if (!totalPasos) {
    establecerTexto(
      'plan-actividades-resumen',
      '0/0 pasos completados'
    );

    return;
  }

  const completados =
    obtenerPasosCompletados(
      planId
    ).filter(
      paso =>
        paso >= 1 &&
        paso <= totalPasos
    ).length;

  const porcentaje =
    Math.round(
      (completados / totalPasos) * 100
    );

  establecerTexto(
    'plan-actividades-resumen',
    `${completados}/${totalPasos} pasos completados`
  );

  establecerTexto(
    'plan-progreso-valor',
    `${porcentaje}%`
  );

  const barra =
    document.getElementById(
      'plan-progreso-barra'
    );

  if (barra) {

    barra.value = porcentaje;
    barra.hidden = false;

  }

  const seccion =
    document.querySelector(
      '.plan-progreso'
    );

  if (seccion) {
    seccion.hidden = false;
  }
}


/* =========================================================
   COMPLETAR TAREA
========================================================= */

function configurarCompletarTarea(
  plan,
  planId,
  totalPasos
) {

  const boton =
    document.getElementById(
      'btn-completar-tarea'
    );

  if (!boton) {
    return;
  }

  const completada =
    estaTareaCompletada(
      planId
    );

  const pasosCompletos =
    todosLosPasosCompletados(
      planId,
      totalPasos
    );

  /* -----------------------------------------
     ESTADO DEL BOTÓN
  ----------------------------------------- */

  if (completada) {

    boton.disabled = true;

    boton.textContent =
      '✅ Tarea completada';

    boton.title =
      'Esta tarea ya fue completada.';

    return;
  }

  if (!pasosCompletos) {

    boton.disabled = true;

    boton.textContent =
      '🔒 Completa los pasos';

    boton.title =
      `Debes completar los ${totalPasos} pasos antes de finalizar la tarea.`;

    return;
  }

  /* Todos los pasos están completos */

  boton.disabled = false;

  boton.textContent =
    '✅ Completar tarea';

  boton.title =
    'Todos los pasos están completos. Puedes finalizar la tarea.';

  boton.onclick = () => {

    if (
      !planId ||
      estaTareaCompletada(planId) ||
      !todosLosPasosCompletados(
        planId,
        totalPasos
      )
    ) {
      return;
    }

    boton.disabled = true;

    boton.textContent =
      'Guardando...';

    completarTareaLocal(
      planId
    );

    establecerTexto(
      'plan-estado',
      '✅ Completada'
    );

    boton.textContent =
      '✅ Tarea completada';

    boton.title =
      'Esta tarea ya fue completada.';

  };
}


/* =========================================================
   RESUMEN
========================================================= */

function actualizarResumenActividades(
  actividades
) {

  if (
    !Array.isArray(actividades) ||
    !actividades.length
  ) {
    return;
  }

  const duraciones =
    actividades
      .map(
        actividad =>
          Number(
            actividad.duracion ??
            actividad.duracion_minutos
          )
      )
      .filter(Number.isFinite);

  if (duraciones.length) {

    const total =
      duraciones.reduce(
        (total, duracion) =>
          total + duracion,
        0
      );

    establecerTexto(
      'plan-duracion-resumen',
      `${total} min`
    );
  }
}


/* =========================================================
   MÉTODOS DE ESTUDIO
========================================================= */

function inicializarMetodos(plan) {

  const selector =
    document.getElementById(
      'selector-metodo'
    );

  if (!selector) {
    return;
  }

  selector.value =
    normalizarMetodo(
      plan?.metodo_estudio
    );

  selector.addEventListener(
    'change',
    () =>
      cambiarMetodo(
        selector.value,
        true
      )
  );

  document
    .getElementById('pomodoro-iniciar')
    ?.addEventListener(
      'click',
      iniciarPomodoro
    );

  document
    .getElementById('pomodoro-pausar')
    ?.addEventListener(
      'click',
      pausarPomodoro
    );

  document
    .getElementById('pomodoro-reiniciar')
    ?.addEventListener(
      'click',
      reiniciarPomodoro
    );

  document
    .getElementById('feynman-confirmar')
    ?.addEventListener(
      'click',
      validarFeynman
    );

  const actividades =
    obtenerPasos(plan);

  tarjetasRecall =
    actividades
      .map(
        actividad => ({
          pregunta:
            actividad.titulo ||
            actividad.nombre,

          respuesta:
            actividad.descripcion ||
            'No hay una respuesta detallada en este plan.'
        })
      )
      .filter(
        tarjeta =>
          tarjeta.pregunta
      );

  renderizarRecall();

  renderizarRepasos(
    actividades
  );

  cambiarMetodo(
    selector.value,
    Boolean(
      plan?.metodo_estudio
    )
  );
}


function normalizarMetodo(
  metodo = ''
) {

  const texto =
    String(metodo)
      .toLowerCase();

  if (
    texto.includes('feynman')
  ) {
    return 'feynman';
  }

  if (
    texto.includes('recall')
  ) {
    return 'active-recall';
  }

  if (
    texto.includes('spaced') ||
    texto.includes('repetition')
  ) {
    return 'spaced-repetition';
  }

  return 'pomodoro';
}


function cambiarMetodo(
  metodo,
  metodoDelPlan = false
) {

  document
    .querySelectorAll(
      '.metodo-interactivo'
    )
    .forEach(panel => {

      panel.hidden =
        panel.id !==
        `metodo-${metodo}`;

    });

  const nombre = {

    pomodoro: 'Pomodoro',

    feynman: 'Feynman',

    'active-recall':
      'Active Recall',

    'spaced-repetition':
      'Spaced Repetition'

  }[metodo];

  if (metodoDelPlan) {

    establecerTexto(
      'metodo-actual-nombre',
      nombre
    );

  } else {

    mostrarNota(
      'Método no informado por el plan; la herramienta inicia en Pomodoro.'
    );
  }
}


/* =========================================================
   POMODORO
========================================================= */

function iniciarPomodoro() {

  if (temporizador) {
    return;
  }

  temporizador =
    setInterval(() => {

      segundosRestantes--;

      actualizarReloj();

      if (
        segundosRestantes <= 0
      ) {

        modoPomodoro =
          modoPomodoro === 'Trabajo'
            ? 'Descanso'
            : 'Trabajo';

        segundosRestantes =
          modoPomodoro === 'Trabajo'
            ? 25 * 60
            : 5 * 60;

        actualizarReloj();
      }

    }, 1000);

  mostrarNota(
    `Temporizador en modo ${modoPomodoro.toLowerCase()}.`
  );
}


function pausarPomodoro() {

  clearInterval(
    temporizador
  );

  temporizador = null;

  mostrarNota(
    'Temporizador pausado.'
  );
}


function reiniciarPomodoro() {

  pausarPomodoro();

  segundosRestantes =
    modoPomodoro === 'Trabajo'
      ? 25 * 60
      : 5 * 60;

  actualizarReloj();
}


function actualizarReloj() {

  const tiempo =
    document.getElementById(
      'pomodoro-tiempo'
    );

  const estado =
    document.getElementById(
      'pomodoro-estado'
    );

  if (tiempo) {

    tiempo.textContent =
      `${String(
        Math.floor(
          segundosRestantes / 60
        )
      ).padStart(2, '0')}:${String(
        segundosRestantes % 60
      ).padStart(2, '0')}`;

  }

  if (estado) {
    estado.textContent =
      modoPomodoro;
  }
}


/* =========================================================
   FEYNMAN
========================================================= */

function validarFeynman() {

  const entrada =
    document.getElementById(
      'feynman-explicacion'
    );

  const feedback =
    document.getElementById(
      'feynman-feedback'
    );

  if (!entrada || !feedback) {
    return;
  }

  const palabras =
    entrada.value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .length;

  if (palabras < 5) {

    feedback.textContent =
      'Escribe al menos cinco palabras para comprobar que la explicación tiene contenido.';

    feedback.className =
      'metodo-error';

  } else {

    feedback.textContent =
      'Explicación confirmada. Revisa si podrías hacerla todavía más simple.';

    feedback.className =
      'metodo-ok';
  }
}


/* =========================================================
   ACTIVE RECALL
========================================================= */

function renderizarRecall() {

  const contador =
    document.getElementById(
      'recall-contador'
    );

  const progreso =
    document.getElementById(
      'recall-progreso'
    );

  const pregunta =
    document.getElementById(
      'recall-pregunta'
    );

  const respuesta =
    document.getElementById(
      'recall-respuesta'
    );

  if (!contador || !progreso || !pregunta || !respuesta) {
    return;
  }

  const tarjeta =
    tarjetasRecall[
      tarjetaActual
    ];

  contador.textContent =
    tarjetasRecall.length
      ? `${tarjetaActual + 1}/${tarjetasRecall.length}`
      : '0/0';

  progreso.textContent =
    tarjetasRecall.length
      ? `${Math.round(
          ((tarjetaActual + 1) /
            tarjetasRecall.length) *
          100
        )}% del plan`
      : 'Sin tarjetas';

  pregunta.textContent =
    tarjeta?.pregunta ||
    'No hay preguntas en este plan.';

  respuesta.textContent =
    tarjeta?.respuesta ||
    '';

  respuesta.hidden = true;
}


/* =========================================================
   REPASOS
========================================================= */

function renderizarRepasos(
  actividades
) {

  const lista =
    document.getElementById(
      'lista-repasos'
    );

  const selector =
    document.getElementById(
      'repaso-fecha'
    );

  if (!lista) {
    return;
  }

  const fechas =
    actividades
      .filter(
        actividad =>
          actividad.fecha
      )
      .map(
        actividad => ({
          fecha:
            actividad.fecha,

          titulo:
            actividad.titulo ||
            actividad.nombre ||
            'Repaso'
        })
      );

  lista.innerHTML =
    fechas.length

      ? fechas
          .map(
            item => `
              <div class="repaso-item">
                <strong>
                  ${escapar(item.fecha)}
                </strong>

                <span>
                  ${escapar(item.titulo)}
                </span>
              </div>
            `
          )
          .join('')

      : `
        <p>
          No hay fechas de repaso en este plan.
        </p>
      `;

  if (selector) {

    selector.addEventListener(
      'change',
      evento => {

        document
          .querySelectorAll(
            '.repaso-item'
          )
          .forEach(item => {

            item.classList.toggle(
              'seleccionado',
              item.textContent.includes(
                evento.target.value
              )
            );

          });

      }
    );
  }
}


/* =========================================================
   BOTONES ACTIVE RECALL
========================================================= */

document
  .getElementById(
    'recall-mostrar'
  )
  ?.addEventListener(
    'click',
    () => {

      const respuesta =
        document.getElementById(
          'recall-respuesta'
        );

      if (respuesta) {
        respuesta.hidden = false;
      }

    }
  );


document
  .getElementById(
    'recall-siguiente'
  )
  ?.addEventListener(
    'click',
    () => {

      if (!tarjetasRecall.length) {
        return;
      }

      tarjetaActual =
        (tarjetaActual + 1) %
        tarjetasRecall.length;

      renderizarRecall();

    }
  );


/* =========================================================
   UTILIDADES
========================================================= */

function mostrarNota(texto) {

  const nota =
    document.getElementById(
      'metodo-nota'
    );

  if (nota) {
    nota.textContent =
      texto;
  }
}


function establecerTexto(
  id,
  valor,
  vacio = 'No disponible',
  fecha = false
) {

  const elemento =
    document.getElementById(id);

  if (!elemento) {
    return;
  }

  const contenedor =
    elemento.closest('article') ||
    (
      id === 'plan-progreso-valor'
        ? elemento.closest(
            '.plan-progreso'
          )
        : null
    );

  if (
    valor == null ||
    valor === ''
  ) {

    elemento.textContent =
      vacio;

    if (contenedor) {
      contenedor.hidden = true;
    }

    return;
  }

  if (contenedor) {
    contenedor.hidden = false;
  }

  elemento.textContent =
    fecha
      ? formatearFecha(valor)
      : valor;
}


function formatearFecha(
  valor
) {

  const fecha =
    new Date(valor);

  return Number.isNaN(
    fecha.getTime()
  )
    ? valor
    : fecha.toLocaleDateString(
        'es-ES'
      );
}


function escapar(
  valor
) {

  return String(
    valor ?? ''
  ).replace(
    /[&<>"']/g,
    caracter =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[caracter]
  );
}