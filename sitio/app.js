// AgroClima Jalapa — el poco JavaScript de la página. Sin JS todo se lee igual:
// el simulador muestra su estado inicial y la tabla de límites, y la portada, la primera pantalla.

const quieto = matchMedia('(prefers-reduced-motion: reduce)');

// ---------- Entradas al aparecer (una sola vez, con escalón) ----------
(() => {
  const grupos = ['.pasos3', '.pasos', '.manuales', '.acordeon', '.semana'];
  grupos.forEach((g) => document.querySelectorAll(`${g} > *`).forEach((el, i) => {
    el.classList.add('revelar');
    el.style.setProperty('--d', `${Math.min(i, 6) * 80}ms`);
  }));
  const els = document.querySelectorAll('.revelar');
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('es-visible')); return; }
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) if (e.isIntersecting) { e.target.classList.add('es-visible'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  els.forEach((el) => io.observe(el));
  addEventListener('load', () => setTimeout(() => {
    els.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('es-visible'); });
  }, 2500));
})();

// ---------- Portada: las pantallas reales pasan dentro del teléfono ----------
(() => {
  const pantallas = [...document.querySelectorAll('#pantallas .pantalla')];
  const botones = [...document.querySelectorAll('#selector button')];
  if (!pantallas.length) return;
  let actual = 0, reloj = null;
  const mostrar = (i) => {
    actual = (i + pantallas.length) % pantallas.length;
    pantallas.forEach((p, j) => p.classList.toggle('es-activa', j === actual));
    botones.forEach((b, j) => b.setAttribute('aria-selected', String(j === actual)));
  };
  const seguir = () => { clearInterval(reloj); if (!quieto.matches) reloj = setInterval(() => mostrar(actual + 1), 3800); };
  botones.forEach((b) => b.addEventListener('click', () => { mostrar(+b.dataset.i); seguir(); }));
  const telefono = document.querySelector('.hero-telefono');
  telefono.addEventListener('pointerenter', () => clearInterval(reloj));
  telefono.addEventListener('pointerleave', seguir);
  document.addEventListener('visibilitychange', () => (document.hidden ? clearInterval(reloj) : seguir()));
  seguir();
})();

// ---------- Simulador de avisos ----------
// Límites: docs/UMBRALES.md (Tabla 31 de la tesis). Textos: functions/src/mensajes.js de la app.
(() => {
  const raiz = document.getElementById('sim');
  if (!raiz) return;
  const lista = document.getElementById('sim-notis');
  const chip = document.getElementById('sim-chip');
  const medida = document.getElementById('sim-medida');
  const salidas = { tmin: ['o-tmin', ' °C'], tmax: ['o-tmax', ' °C'], lluvia: ['o-lluvia', ' mm'], viento: ['o-viento', ' km/h'] };

  const PALABRA = { 1: 'NORMAL', 2: 'PRECAUCIÓN', 3: 'PELIGRO' };
  const CLASE = { 1: 'chip-normal', 2: 'chip-precaucion', 3: 'chip-peligro' };
  const ICONO = { 1: '#i-bien', 2: '#i-cuidado', 3: '#i-peligro' };
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

  // nivel para cada riesgo según cultivo, etapa y días (0 = sin aviso)
  const nivelFrio = (c, t) => (t <= 0 ? 3 : (c === 'cafe' && t < 15) || (c === 'frijol' && t < 18) ? 2 : 0);
  const limiteCalor = { cafe: 30, frijol: 28, maiz: 35 };
  const nivelCalor = (c, etapa, dias, t) => {
    const lim = limiteCalor[c];
    if (!lim || t <= lim) return 0;
    if (c === 'maiz') return etapa === 'floracion' || etapa === 'llenado' ? 3 : etapa === 'desarrolloVegetativo' ? 2 : 0;
    return dias >= 3 ? 3 : 2;
  };
  const nivelUmbral = (v) => (v > 30 ? 3 : v > 15 ? 2 : 0);

  const evaluar = (d) => {
    const r = [];
    const ll = nivelUmbral(d.lluvia); if (ll) r.push({ tipo: 'lluviaIntensa', nivel: ll, valor: d.lluvia });
    const vi = nivelUmbral(d.viento); if (vi) r.push({ tipo: 'vientoFuerte', nivel: vi, valor: d.viento });
    const fr = nivelFrio(d.cultivo, d.tmin); if (fr) r.push({ tipo: 'temperaturaBaja', nivel: fr, valor: d.tmin, helada: d.tmin <= 0 });
    const ca = nivelCalor(d.cultivo, d.etapa, d.dias, d.tmax);
    if (ca) r.push({ tipo: 'temperaturaAlta', nivel: ca, valor: d.tmax, limite: limiteCalor[d.cultivo], racha: d.cultivo !== 'maiz' && d.dias >= 3 });
    return r.sort((a, b) => b.nivel - a.nivel);
  };

  // pinta cada barra con sus zonas: verde (sin aviso), amarillo (PRECAUCIÓN) y rojo (PELIGRO)
  const COLOR = { 0: 'var(--zona-normal)', 1: 'var(--zona-normal)', 2: 'var(--zona-precaucion)', 3: 'var(--zona-peligro)' };
  const pintarPista = (input, nivelDe) => {
    const min = +input.min, max = +input.max, paradas = [];
    let previo = null;
    for (let v = min; v <= max; v++) {
      const n = nivelDe(v);
      const desde = ((v - min) / (max - min + 1)) * 100, hasta = ((v - min + 1) / (max - min + 1)) * 100;
      if (n !== previo) { paradas.push(`${COLOR[n]} ${desde.toFixed(2)}%`); previo = n; }
      paradas.push(`${COLOR[n]} ${hasta.toFixed(2)}%`);
    }
    input.style.setProperty('--pista', `linear-gradient(90deg, ${paradas.join(', ')})`);
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

  const el = (tag, cls, texto) => { const n = document.createElement(tag); if (cls) n.className = cls; if (texto != null) n.textContent = texto; return n; };
  const noti = (titulo, cuerpo, nueva) => {
    const li = el('li', 'noti' + (nueva ? ' es-nueva' : ''));
    const img = el('img'); img.src = 'img/logo.svg'; img.alt = ''; img.width = 36; img.height = 36;
    const div = el('div');
    div.append(el('p', 'noti-app', 'AgroClima Jalapa · ahora'), el('p', 'noti-titulo', titulo), el('p', 'noti-cuerpo', cuerpo));
    li.append(img, div);
    return li;
  };
  const ponerChip = (nivel) => {
    chip.className = 'chip ' + CLASE[nivel];
    chip.querySelector('use').setAttribute('href', ICONO[nivel]);
    chip.querySelector('span').textContent = PALABRA[nivel];
  };

  const valor = (n) => { const e = raiz.querySelector(`[name="${n}"]:checked`) || raiz.querySelector(`[name="${n}"]:not([type=radio])`); return e ? e.value : ''; };
  let anterior = '';
  const pintar = () => {
    const d = {
      cultivo: valor('cultivo'), etapa: valor('etapa'),
      parcela: valor('parcela').trim() || 'su parcela',
      tmin: +valor('tmin'), tmax: +valor('tmax'), lluvia: +valor('lluvia'), viento: +valor('viento'), dias: +valor('dias'),
    };
    for (const [k, [id, u]] of Object.entries(salidas)) document.getElementById(id).textContent = d[k] + u;
    pintarPista(raiz.querySelector('[name=tmin]'), (v) => nivelFrio(d.cultivo, v));
    pintarPista(raiz.querySelector('[name=tmax]'), (v) => nivelCalor(d.cultivo, d.etapa, d.dias, v));
    pintarPista(raiz.querySelector('[name=lluvia]'), nivelUmbral);
    pintarPista(raiz.querySelector('[name=viento]'), nivelUmbral);

    const riesgos = evaluar(d);
    const firma = JSON.stringify(riesgos.map((x) => [x.tipo, x.nivel]));
    const nuevas = firma !== anterior; anterior = firma;
    lista.replaceChildren();
    if (!riesgos.length) {
      lista.append(noti(`Todo tranquilo en ${d.parcela}`, `Con este pronóstico ${SU_CULTIVO[d.cultivo]} riesgo. No le llega ningún aviso.`, nuevas));
      ponerChip(1);
      medida.textContent = 'La app sigue revisando el pronóstico cada 3 horas, aunque tenga el teléfono guardado.';
      return;
    }
    riesgos.slice(0, 3).forEach((x) => {
      lista.append(noti(`${PALABRA[x.nivel]}: ${nombreRiesgo(x)} en ${d.parcela}`, `${situacion(x)} ${medidaDe(x.tipo, d.cultivo)[0]}`, nuevas));
    });
    ponerChip(riesgos[0].nivel);
    medida.textContent = medidaDe(riesgos[0].tipo, d.cultivo)[1];
  };
  raiz.addEventListener('input', pintar);
  raiz.addEventListener('change', pintar);
  pintar();
})();

// ---------- Mis avisos: qué suena y qué queda en Alertas ----------
// Regla de la app (UMBRALES §6): suena si el tipo está encendido, el nivel llega al mínimo y no es de
// noche (de 10 p.m. a 5 a.m.), salvo PELIGRO, que siempre suena.
(() => {
  const raiz = document.getElementById('prefs');
  const filas = document.querySelectorAll('#semana li');
  const cuenta = document.getElementById('cuenta');
  if (!raiz || !filas.length) return;
  const campo = (n) => raiz.querySelector(`[name="${n}"]`);
  const pintar = () => {
    const minimo = +campo('minimo').value;
    const noche = campo('noche').checked;
    let suenan = 0;
    filas.forEach((li) => {
      const nivel = +li.dataset.nivel, hora = +li.dataset.hora;
      const deNoche = hora >= 22 || hora < 5;
      const suena = campo(li.dataset.tipo).checked && nivel >= minimo && (!noche || !deNoche || nivel === 3);
      const destino = li.querySelector('.destino');
      destino.textContent = suena ? 'Suena' : 'Queda en Alertas';
      destino.classList.toggle('destino-no', !suena);
      li.classList.toggle('callado', !suena);
      if (suena) suenan++;
    });
    cuenta.textContent = `Le suenan ${suenan} de ${filas.length} avisos.`;
  };
  raiz.addEventListener('input', pintar);
  raiz.addEventListener('change', pintar);
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
