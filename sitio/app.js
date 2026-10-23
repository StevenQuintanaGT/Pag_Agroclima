// AgroClima Jalapa — lo poco de JavaScript que necesita la página.
// Sin JS todo se lee igual: el simulador muestra su estado inicial y la tabla de límites.

// ---------- Entradas al aparecer (una sola vez, con escalón) ----------
(() => {
  // las partes de cada sección: el título, luego el texto, luego la pieza, con 70 ms entre una y otra
  const grupos = [
    ['#cultivos .sim-columna', ':scope > h2, :scope > .sim-intro, .bloque, :scope > .limites'],
    ['#como .como-columna', ':scope > h2'],
    ['#mis-avisos', ':scope > h2, :scope > .escaparate-intro, .panel, .semana li, :scope > .escaparate-pie'],
    ['#instalar .lista-columna', ':scope > h2, :scope > .lista-intro, .grupo, .filas li, .lista-accion'],
    ['#preguntas', ':scope > h2, .mosaicos details'],
    ['#proyecto .carta-columna', ':scope > *'],
    ['.cierre-form', ':scope > h2, :scope > .cierre-nota'],
    ['.pie', ':scope > .mosaico'],
  ];
  for (const [raiz, partes] of grupos) {
    const r = document.querySelector(raiz);
    if (!r) continue;
    r.querySelectorAll(partes).forEach((el, i) => {
      if (el.hasAttribute('data-reveal')) return;
      el.setAttribute('data-reveal', '');
      el.style.setProperty('--d', `${Math.min(i, 6) * 70}ms`);
    });
  }
  const targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;
  // escalón dentro de cada grupo: la frase, luego la llamada, luego la respuesta
  document.querySelectorAll('.intercambio').forEach((g) => {
    g.querySelectorAll('[data-reveal]').forEach((el, i) => el.style.setProperty('--d', `${i * 80}ms`));
  });
  if (!('IntersectionObserver' in window)) { targets.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
  targets.forEach((el) => io.observe(el));
  addEventListener('load', () => setTimeout(() => {
    targets.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
  }, 2500));
})();

// ---------- Portada: la cinta de pantallas avanza mientras la frase se queda ----------
(() => {
  const hero = document.querySelector('.hero');
  const cinta = document.querySelector('.carrete-cinta');
  if (!hero || !cinta) return;
  const ancho = matchMedia('(min-width: 1000px)');
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  let pedido = false;
  const mover = () => {
    pedido = false;
    if (!ancho.matches || quieto.matches) { cinta.style.transform = ''; return; }
    const cuadros = cinta.children;
    if (cuadros.length < 2) return;
    const paso = cuadros[1].offsetTop - cuadros[0].offsetTop;
    const recorrido = hero.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / recorrido));
    cinta.style.transform = `translateY(${-p * paso * (cuadros.length - 1)}px)`;
  };
  const pedir = () => { if (!pedido) { pedido = true; requestAnimationFrame(mover); } };
  addEventListener('scroll', pedir, { passive: true });
  addEventListener('resize', pedir);
  mover();
})();

// ---------- Simulador de avisos ----------
// Límites: docs/UMBRALES.md (Tabla 31 de la tesis). Textos: functions/src/mensajes.js de la app.
(() => {
  const form = document.getElementById('sim');
  if (!form) return;
  const lista = document.getElementById('sim-notis');
  const detalle = document.getElementById('sim-detalle');
  const chip = document.getElementById('sim-chip');
  const medida = document.getElementById('sim-medida');
  const salidas = { tmin: ['o-tmin', ' °C'], tmax: ['o-tmax', ' °C'], lluvia: ['o-lluvia', ' mm'], viento: ['o-viento', ' km/h'] };

  const PALABRA = { 1: 'NORMAL', 2: 'PRECAUCIÓN', 3: 'PELIGRO' };
  const CLASE = { 1: 'chip-normal', 2: 'chip-precaucion', 3: 'chip-peligro' };
  const SU_CULTIVO = { maiz: 'su maíz no corre', frijol: 'su frijol no corre', cafe: 'su café no corre', hortalizas: 'sus hortalizas no corren' };
  const MEDIDAS = {
    lluviaIntensa: {
      '': ['Revise que el agua pueda salir de la parcela.', 'Limpie zanjas y salidas de agua para que no se encharque. No abone ni fumigue ese día: la lluvia lo lava.'],
      cafe: ['Revise que el agua pueda salir del cafetal.', 'Limpie las cunetas del cafetal y revise los terrenos con pendiente. No abone ese día: la lluvia lo lava.'],
      hortalizas: ['Abra salidas de agua entre los surcos.', 'Abra salidas de agua entre los surcos y, si puede, cubra los almácigos. No fumigue ese día.'],
    },
    vientoFuerte: {
      '': ['No fumigue.', 'No fumigue ni abone con viento: se pierde el producto. Amarre o apuntale lo que pueda caerse.'],
      maiz: ['No fumigue.', 'No fumigue ese día. Si el maíz está alto, aporque para que no se acame.'],
      cafe: ['No fumigue.', 'No fumigue ese día. Revise la sombra y las ramas que puedan caer sobre el cafetal.'],
    },
    temperaturaBaja: {
      '': ['Toque para ver qué hacer.', 'Proteja los almácigos y las plantas pequeñas con plástico o rastrojo durante la noche. Riegue por la tarde: el suelo húmedo guarda mejor el calor.'],
      cafe: ['Proteja el almácigo.', 'Proteja el almácigo y las plantas nuevas del cafetal durante la noche. Con frío el café crece más despacio.'],
      frijol: ['Proteja las plantas pequeñas.', 'El frijol se atrasa con noches frías. Proteja las plantas pequeñas y, si aún no ha sembrado, espere a que pase el frío.'],
    },
    temperaturaAlta: {
      '': ['Riegue si puede.', 'Riegue temprano o al atardecer y evite los trabajos pesados en las horas de más sol.'],
      cafe: ['Dé sombra y riegue si puede.', 'Revise la sombra del cafetal y riegue si puede. El calor fuerte puede botar la flor y el grano tierno.'],
      frijol: ['Riegue en las horas frescas.', 'Riegue en las horas frescas. Con mucho calor el frijol puede botar la flor.'],
      maiz: ['Riegue si puede.', 'Riegue si puede, sobre todo si el maíz está floreando: el calor fuerte seca el polen.'],
    },
  };
  const medidaDe = (tipo, cultivo) => MEDIDAS[tipo][cultivo] || MEDIDAS[tipo][''];

  const evaluar = (d) => {
    const r = [];
    // lluvia y viento: todos los cultivos
    if (d.lluvia > 30) r.push({ tipo: 'lluviaIntensa', nivel: 3, valor: d.lluvia }); else if (d.lluvia > 15) r.push({ tipo: 'lluviaIntensa', nivel: 2, valor: d.lluvia });
    if (d.viento > 30) r.push({ tipo: 'vientoFuerte', nivel: 3, valor: d.viento }); else if (d.viento > 15) r.push({ tipo: 'vientoFuerte', nivel: 2, valor: d.viento });
    // frío: helada para todos; café < 15 y frijol < 18
    if (d.tmin <= 0) r.push({ tipo: 'temperaturaBaja', nivel: 3, valor: d.tmin, helada: true });
    else if ((d.cultivo === 'cafe' && d.tmin < 15) || (d.cultivo === 'frijol' && d.tmin < 18)) r.push({ tipo: 'temperaturaBaja', nivel: 2, valor: d.tmin });
    // calor
    const limite = { cafe: 30, frijol: 28, maiz: 35 }[d.cultivo];
    if (limite && d.tmax > limite) {
      let nivel = 0;
      if (d.cultivo === 'maiz') nivel = d.etapa === 'floracion' || d.etapa === 'llenado' ? 3 : d.etapa === 'desarrolloVegetativo' ? 2 : 0;
      else nivel = d.dias >= 3 ? 3 : 2;
      if (nivel) r.push({ tipo: 'temperaturaAlta', nivel, valor: d.tmax, limite, racha: d.cultivo !== 'maiz' && d.dias >= 3 });
    }
    return r.sort((a, b) => b.nivel - a.nivel);
  };

  const nombreRiesgo = (x) => ({ lluviaIntensa: 'lluvia fuerte', vientoFuerte: 'viento fuerte', temperaturaBaja: x.helada ? 'puede caer helada' : 'frío', temperaturaAlta: 'mucho calor' })[x.tipo];
  const situacion = (x) => {
    const v = Math.round(x.valor);
    switch (x.tipo) {
      case 'lluviaIntensa': return `Mañana se esperan hasta ${v} mm de lluvia por hora.`;
      case 'vientoFuerte': return `Mañana, viento de hasta ${v} km/h.`;
      case 'temperaturaBaja': return x.helada ? `Mañana en la madrugada puede bajar a ${v} °C.` : `Mañana en la madrugada se esperan ${v} °C.`;
      case 'temperaturaAlta': return x.racha ? `Desde mañana, 3 días seguidos con más de ${x.limite} °C.` : `Mañana se esperan ${v} °C.`;
      default: return '';
    }
  };

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const noti = (titulo, cuerpo, nueva) => {
    const li = el('li', 'noti' + (nueva ? ' es-nueva' : ''));
    const img = el('img'); img.src = 'img/logo.svg'; img.alt = ''; img.width = 36; img.height = 36;
    const div = el('div');
    div.append(el('p', 'noti-app', 'AgroClima Jalapa · ahora'), el('p', 'noti-titulo', titulo), el('p', 'noti-cuerpo', cuerpo));
    li.append(img, div);
    return li;
  };

  let anterior = '';
  const pintar = () => {
    const v = (n) => { const el = form.querySelector(`[name="${n}"]:checked`) || form.querySelector(`[name="${n}"]:not([type=radio])`); return el ? el.value : ''; };
    const d = {
      cultivo: v('cultivo'), etapa: v('etapa'),
      parcela: v('parcela').trim() || 'su parcela',
      tmin: +v('tmin'), tmax: +v('tmax'), lluvia: +v('lluvia'), viento: +v('viento'), dias: +v('dias'),
    };
    for (const [k, [id, u]] of Object.entries(salidas)) document.getElementById(id).textContent = d[k] + u;

    const riesgos = evaluar(d);
    const firma = JSON.stringify(riesgos.map((x) => [x.tipo, x.nivel]));
    const nuevas = firma !== anterior; anterior = firma;
    lista.replaceChildren();
    if (!riesgos.length) {
      lista.append(noti(`Todo tranquilo en ${d.parcela}`, `Con este pronóstico ${SU_CULTIVO[d.cultivo]} riesgo. No le llega ningún aviso.`, nuevas));
      chip.className = 'chip chip-normal'; chip.textContent = 'NORMAL';
      detalle.classList.add('es-calma');
      medida.textContent = 'La app sigue revisando el pronóstico cada 3 horas, aunque tenga el teléfono guardado.';
      return;
    }
    riesgos.slice(0, 3).forEach((x) => {
      const [corta] = medidaDe(x.tipo, d.cultivo);
      lista.append(noti(`${PALABRA[x.nivel]}: ${nombreRiesgo(x)} en ${d.parcela}`, `${situacion(x)} ${corta}`, nuevas));
    });
    const top = riesgos[0];
    chip.className = 'chip ' + CLASE[top.nivel]; chip.textContent = PALABRA[top.nivel];
    detalle.classList.remove('es-calma');
    medida.textContent = medidaDe(top.tipo, d.cultivo)[1];
  };
  form.addEventListener('input', pintar);
  form.addEventListener('change', pintar);
  pintar();
})();

// ---------- Mis avisos: qué suena y qué queda en Alertas ----------
// Regla de la app (UMBRALES §6): suena si el tipo está encendido, el nivel llega al mínimo y no es de
// noche (de 10 p.m. a 5 a.m.), salvo PELIGRO, que siempre suena.
(() => {
  const form = document.getElementById('prefs');
  const filas = document.querySelectorAll('#semana li');
  const cuenta = document.getElementById('cuenta');
  if (!form || !filas.length) return;
  const pintar = () => {
    const campo = (n) => form.querySelector(`[name="${n}"]`);
    const minimo = +campo('minimo').value;
    const noche = campo('noche').checked;
    let suenan = 0;
    filas.forEach((li) => {
      const nivel = +li.dataset.nivel, hora = +li.dataset.hora;
      const encendido = campo(li.dataset.tipo).checked;
      const deNoche = hora >= 22 || hora < 5;
      const suena = encendido && nivel >= minimo && (!noche || !deNoche || nivel === 3);
      const destino = li.querySelector('.destino');
      destino.textContent = suena ? 'Suena' : 'Queda en Alertas';
      destino.classList.toggle('destino-no', !suena);
      li.classList.toggle('callado', !suena);
      if (suena) suenan++;
    });
    cuenta.textContent = `Le suenan ${suenan} de ${filas.length} avisos.`;
  };
  form.addEventListener('input', pintar);
  form.addEventListener('change', pintar);
  pintar();
})();

// ---------- Cierre: el mensaje de WhatsApp lleva el nombre que escribieron ----------
(() => {
  const form = document.getElementById('compartir');
  if (!form) return;
  const base = form.elements.text.value;
  form.addEventListener('submit', () => {
    const nombre = document.getElementById('vecino').value.trim();
    form.elements.text.value = nombre ? `Hola, ${nombre}. ${base}` : base;
  });
})();
