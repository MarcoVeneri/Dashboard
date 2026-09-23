(() => {
  "use strict";

  const STORAGE_KEY = "commute.tomtomApiKey.v1";
  const COORDS_KEY = "commute.coords.v1";
  const REFRESH_MS = 5 * 60 * 1000;

  const START_ADDRESS = "Via J. F. Kennedy 9, Reggello, Firenze, Italia";
  const END_ADDRESS = "Via Panciatichi 17, Firenze, Italia";

  // Punto obbligatorio sulla carreggiata A1 verso Firenze/Bologna (zona Chianti Est).
  // Serve a rendere il confronto reale: il percorso "Autostrada A1" deve usare davvero l'A1.
  const A1_REQUIRED_POINT = { lat: 43.73004, lon: 11.33241 };

  const $ = (sel) => document.querySelector(sel);

  const ui = {
    clock: $("#clock"),
    greeting: $("#greeting"),
    refreshMeta: $("#refresh-meta"),
    refreshBtn: $("#refresh-btn"),
    settingsBtn: $("#settings-btn"),
    settingsDialog: $("#settings-dialog"),
    settingsForm: $("#settings-form"),
    closeSettings: $("#close-settings"),
    keyInput: $("#tomtom-key"),
    toggleKey: $("#toggle-key"),
    clearKey: $("#clear-key"),
    settingsMessage: $("#settings-message"),
    fastTime: $("#fast-time"),
    normalTime: $("#normal-time"),
    bestCard: $("#best-card"),
    normalCard: $("#normal-card"),
    fastLabelText: $("#fast-label-text"),
    normalBestLabel: $("#normal-best-label"),
    savingValue: $("#saving-value"),
    savingLabel: $("#saving-label"),
    fastStatus: $("#fast-status"),
    normalStatus: $("#normal-status"),
    fastTrafficBar: $("#fast-traffic-bar"),
    normalTrafficBar: $("#normal-traffic-bar"),
    bestBadge: $("#best-badge"),
    wazeFast: $("#waze-fast"),
    wazeNormal: $("#waze-normal"),
    weatherStartIcon: $("#weather-start-icon"),
    weatherStartTemp: $("#weather-start-temp"),
    weatherStartDesc: $("#weather-start-desc"),
    weatherEndIcon: $("#weather-end-icon"),
    weatherEndTemp: $("#weather-end-temp"),
    weatherEndDesc: $("#weather-end-desc"),
    toast: $("#toast"),
  };

  let lastRefreshAt = 0;
  let nextRefreshAt = 0;
  let refreshTimer = null;
  let metaTimer = null;
  let coords = null;
  let refreshing = false;

  function getKey() {
    return localStorage.getItem(STORAGE_KEY) || "";
  }

  function maskKey(key) {
    if (!key) return "";
    if (key.length <= 8) return "••••••••";
    return `${"•".repeat(Math.min(12, key.length - 4))}${key.slice(-4)}`;
  }

  function italianTime(date = new Date()) {
    return new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function hourRome() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    return Number(parts.find(p => p.type === "hour")?.value || 12);
  }

  function updateGreetingAndClock() {
    const hour = hourRome();
    ui.greeting.textContent =
      hour < 12 ? "Buongiorno Marco" :
      hour < 18 ? "Buon pomeriggio Marco" :
      "Buonasera Marco";
    ui.clock.textContent = italianTime();
  }

  function setSettingsMessage(text, type = "") {
    ui.settingsMessage.textContent = text;
    ui.settingsMessage.className = `settings-message ${type}`.trim();
  }

  function showToast(text) {
    ui.toast.textContent = text;
    ui.toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => ui.toast.classList.remove("show"), 2300);
  }

  function openSettings({ firstRun = false } = {}) {
    const key = getKey();
    ui.keyInput.value = key;
    ui.keyInput.type = "password";
    ui.toggleKey.textContent = "Mostra";
    setSettingsMessage(firstRun ? "Inserisci la chiave TomTom per attivare traffico e tempi." : "");
    if (!ui.settingsDialog.open) ui.settingsDialog.showModal();
    setTimeout(() => ui.keyInput.focus(), 50);
  }

  function closeSettings() {
    if (ui.settingsDialog.open) ui.settingsDialog.close();
  }

  async function fetchJson(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!response.ok) {
        let detail = "";
        try {
          const body = await response.json();
          detail = body?.detailedError?.message || body?.errorText || body?.message || "";
        } catch (_) {}
        throw new Error(detail || `HTTP ${response.status}`);
      }
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function geocode(address, key) {
    const url =
      `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address)}.json` +
      `?key=${encodeURIComponent(key)}&limit=1&countrySet=IT`;
    const data = await fetchJson(url);
    const pos = data?.results?.[0]?.position;
    if (!pos || typeof pos.lat !== "number" || typeof pos.lon !== "number") {
      throw new Error(`Indirizzo non trovato: ${address}`);
    }
    return { lat: pos.lat, lon: pos.lon };
  }

  async function ensureCoords(key, force = false) {
    if (!force && coords) return coords;

    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(COORDS_KEY) || "null");
        if (
          cached?.start?.lat && cached?.start?.lon &&
          cached?.end?.lat && cached?.end?.lon
        ) {
          coords = cached;
          return coords;
        }
      } catch (_) {}
    }

    const [start, end] = await Promise.all([
      geocode(START_ADDRESS, key),
      geocode(END_ADDRESS, key),
    ]);

    coords = { start, end };
    localStorage.setItem(COORDS_KEY, JSON.stringify(coords));
    return coords;
  }

  async function calculateRoute(key, start, end, avoidMotorways = false, requiredVia = null) {
    const locs = requiredVia
      ? `${start.lat},${start.lon}:${requiredVia.lat},${requiredVia.lon}:${end.lat},${end.lon}`
      : `${start.lat},${start.lon}:${end.lat},${end.lon}`;
    const params = new URLSearchParams({
      key,
      traffic: "true",
      travelMode: "car",
      routeType: "fastest",
      computeTravelTimeFor: "all",
      sectionType: "traffic",
      routeRepresentation: "summaryOnly",
      departAt: "now",
    });
    if (avoidMotorways) params.append("avoid", "motorways");

    const url =
      `https://api.tomtom.com/routing/1/calculateRoute/${locs}/json?${params.toString()}`;

    const data = await fetchJson(url);
    const route = data?.routes?.[0];
    if (!route?.summary) throw new Error("Nessun percorso restituito da TomTom.");

    return {
      seconds: Number(route.summary.travelTimeInSeconds || 0),
      delaySeconds: Number(route.summary.trafficDelayInSeconds || 0),
      trafficMeters: Number(route.summary.trafficLengthInMeters || 0),
      lengthMeters: Number(route.summary.lengthInMeters || 0),
      noTrafficSeconds: Number(route.summary.noTrafficTravelTimeInSeconds || 0),
      arrivalTime: route.summary.arrivalTime || null,
    };
  }

  function trafficState(route) {
    const base = route.noTrafficSeconds || Math.max(1, route.seconds - route.delaySeconds);
    const ratio = route.delaySeconds / Math.max(1, base);
    if (ratio < 0.06) return { label: "Scorrevole", color: "var(--ok)", severity: 0 };
    if (ratio < 0.16) return { label: "Rallentato", color: "var(--warn)", severity: 1 };
    return { label: "Traffico intenso", color: "var(--bad)", severity: 2 };
  }

  function paintTrafficBar(el, route) {
    const state = trafficState(route);
    let affected = route.lengthMeters > 0
      ? (route.trafficMeters / route.lengthMeters) * 100
      : (route.delaySeconds / Math.max(1, route.seconds)) * 100;

    affected = Math.max(0, Math.min(88, affected));
    if (state.severity > 0 && affected < 8) affected = 8;

    el.style.setProperty("--traffic-color", state.color);
    el.style.setProperty("--traffic-part", `${affected.toFixed(1)}%`);
    el.setAttribute("aria-label", `${state.label}. Circa ${Math.round(affected)}% del percorso interessato dal traffico.`);
  }

  function mins(seconds) {
    return Math.max(1, Math.round(seconds / 60));
  }

  function updateRoutes(fast, normal) {
    const fastMin = mins(fast.seconds);
    const normalMin = mins(normal.seconds);
    const diff = normalMin - fastMin;

    ui.fastTime.textContent = fastMin;
    ui.normalTime.textContent = normalMin;

    const fastState = trafficState(fast);
    const normalState = trafficState(normal);

    ui.fastStatus.textContent = `${fastState.label} · A1 obbligatoria`;
    ui.normalStatus.textContent = `${normalState.label} · senza autostrada`;

    const motorwayWins = diff >= 0;
    ui.bestCard.classList.toggle("winner", motorwayWins);
    ui.normalCard.classList.toggle("winner", !motorwayWins);
    ui.normalBestLabel.hidden = motorwayWins;
    ui.fastLabelText.textContent = motorwayWins ? "PERCORSO MIGLIORE" : "AUTOSTRADA A1";
    ui.wazeFast.classList.toggle("waze-primary", motorwayWins);
    ui.wazeFast.classList.toggle("waze-secondary", !motorwayWins);
    ui.wazeNormal.classList.toggle("waze-primary", !motorwayWins);
    ui.wazeNormal.classList.toggle("waze-secondary", motorwayWins);

    if (diff > 0) {
      ui.savingValue.textContent = `${diff} min prima`;
      ui.savingValue.style.color = "var(--ok)";
      ui.savingLabel.textContent = "della strada normale";
      ui.bestBadge.textContent = "A1 OBBLIGATORIA";
    } else if (diff < 0) {
      ui.savingValue.textContent = `${Math.abs(diff)} min più lenta`;
      ui.savingValue.style.color = "var(--bad)";
      ui.savingLabel.textContent = "della strada normale";
      ui.bestBadge.textContent = "A1 OBBLIGATORIA";
    } else {
      ui.savingValue.textContent = "stesso tempo";
      ui.savingValue.style.color = "var(--muted)";
      ui.savingLabel.textContent = "rispetto alla strada normale";
      ui.bestBadge.textContent = "A1 OBBLIGATORIA";
    }

    paintTrafficBar(ui.fastTrafficBar, fast);
    paintTrafficBar(ui.normalTrafficBar, normal);
  }

  function weatherFromCode(code) {
    if (code === 0) return { icon: "☀️", text: "Sereno" };
    if ([1,2].includes(code)) return { icon: "🌤️", text: "Poco nuvoloso" };
    if (code === 3) return { icon: "☁️", text: "Nuvoloso" };
    if ([45,48].includes(code)) return { icon: "🌫️", text: "Nebbia" };
    if ([51,53,55,56,57].includes(code)) return { icon: "🌦️", text: "Pioviggine" };
    if ([61,63,65,66,67,80,81,82].includes(code)) return { icon: "🌧️", text: "Pioggia" };
    if ([71,73,75,77,85,86].includes(code)) return { icon: "🌨️", text: "Neve" };
    if ([95,96,99].includes(code)) return { icon: "⛈️", text: "Temporale" };
    return { icon: "🌥️", text: "Variabile" };
  }

  async function getWeather(point) {
    const params = new URLSearchParams({
      latitude: String(point.lat),
      longitude: String(point.lon),
      current: "temperature_2m,weather_code",
      timezone: "Europe/Rome",
    });
    return await fetchJson(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  }

  function renderWeather(data, iconEl, tempEl, descEl) {
    const current = data?.current;
    if (!current) return;
    const code = Number(current.weather_code);
    const weather = weatherFromCode(code);
    iconEl.textContent = weather.icon;
    tempEl.textContent = `${Math.round(Number(current.temperature_2m))}°`;
    descEl.textContent = weather.text;
  }

  function wazeUrl(end) {
    const ll = `${end.lat},${end.lon}`;
    return `https://waze.com/ul?ll=${encodeURIComponent(ll)}&navigate=yes`;
  }

  function wireWaze(end) {
    const url = wazeUrl(end);
    ui.wazeFast.onclick = () => window.location.href = url;
    ui.wazeNormal.onclick = () => {
      showToast("Waze ricalcola il percorso con le sue impostazioni. La scelta “No A1” è calcolata da TomTom.");
      setTimeout(() => { window.location.href = url; }, 700);
    };
  }

  async function refreshAll({ forceCoords = false, silent = false } = {}) {
    if (refreshing) return;
    const key = getKey();

    if (!key) {
      ui.refreshMeta.textContent = "Configura TomTom per iniziare";
      if (!silent) openSettings({ firstRun: true });
      return;
    }

    refreshing = true;
    ui.refreshBtn.disabled = true;
    ui.refreshBtn.textContent = "…";

    try {
      const currentCoords = await ensureCoords(key, forceCoords);

      const [fast, normal, startWeather, endWeather] = await Promise.all([
        calculateRoute(key, currentCoords.start, currentCoords.end, false, A1_REQUIRED_POINT),
        calculateRoute(key, currentCoords.start, currentCoords.end, true),
        getWeather(currentCoords.start),
        getWeather(currentCoords.end),
      ]);

      updateRoutes(fast, normal);
      renderWeather(startWeather, ui.weatherStartIcon, ui.weatherStartTemp, ui.weatherStartDesc);
      renderWeather(endWeather, ui.weatherEndIcon, ui.weatherEndTemp, ui.weatherEndDesc);
      wireWaze(currentCoords.end);

      lastRefreshAt = Date.now();
      nextRefreshAt = lastRefreshAt + REFRESH_MS;
      updateRefreshMeta();

      if (!silent) showToast("Traffico e meteo aggiornati");
    } catch (error) {
      console.error(error);
      ui.refreshMeta.textContent = "Errore aggiornamento · apri ⚙︎";
      if (!silent) showToast(error?.message || "Errore durante l'aggiornamento");
    } finally {
      refreshing = false;
      ui.refreshBtn.disabled = false;
      ui.refreshBtn.textContent = "↻";
    }
  }

  function updateRefreshMeta() {
    if (!lastRefreshAt) return;
    const now = Date.now();
    const remain = Math.max(0, nextRefreshAt - now);
    const remainMin = Math.max(0, Math.ceil(remain / 60000));
    ui.refreshMeta.textContent =
      `Agg. ${italianTime(new Date(lastRefreshAt))} · prossimo ${italianTime(new Date(nextRefreshAt))}` +
      (remainMin <= 1 ? " " : "");
  }

  async function verifyAndSaveKey(key) {
    if (!key || key.length < 8) throw new Error("La chiave sembra troppo corta.");
    const checkedCoords = await Promise.all([
      geocode(START_ADDRESS, key),
      geocode(END_ADDRESS, key),
    ]);
    localStorage.setItem(STORAGE_KEY, key);
    coords = { start: checkedCoords[0], end: checkedCoords[1] };
    localStorage.setItem(COORDS_KEY, JSON.stringify(coords));
  }

  function clearStoredKey() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COORDS_KEY);
    coords = null;
    resetUi();
  }

  function resetUi() {
    ui.fastTime.textContent = "--";
    ui.normalTime.textContent = "--";
    ui.savingValue.textContent = "--";
    ui.fastStatus.textContent = "In attesa";
    ui.normalStatus.textContent = "In attesa";
    ui.refreshMeta.textContent = "Configura TomTom per iniziare";
    ui.weatherStartIcon.textContent = "—";
    ui.weatherStartTemp.textContent = "--°";
    ui.weatherStartDesc.textContent = "In attesa";
    ui.weatherEndIcon.textContent = "—";
    ui.weatherEndTemp.textContent = "--°";
    ui.weatherEndDesc.textContent = "In attesa";
  }


  ui.settingsBtn.addEventListener("click", () => openSettings());
  ui.closeSettings.addEventListener("click", closeSettings);

  ui.toggleKey.addEventListener("click", () => {
    const reveal = ui.keyInput.type === "password";
    ui.keyInput.type = reveal ? "text" : "password";
    ui.toggleKey.textContent = reveal ? "Nascondi" : "Mostra";
  });

  ui.settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const key = ui.keyInput.value.trim();
    setSettingsMessage("Verifica della chiave…");
    ui.settingsForm.querySelector("#save-key").disabled = true;

    try {
      await verifyAndSaveKey(key);
      setSettingsMessage(`Chiave verificata e salvata (${maskKey(key)}).`, "ok");
      await refreshAll({ silent: true });
      setTimeout(closeSettings, 550);
    } catch (error) {
      console.error(error);
      setSettingsMessage(error?.message || "Chiave non valida o servizio non raggiungibile.", "error");
    } finally {
      ui.settingsForm.querySelector("#save-key").disabled = false;
    }
  });

  ui.clearKey.addEventListener("click", () => {
    clearStoredKey();
    ui.keyInput.value = "";
    setSettingsMessage("Chiave cancellata da questo dispositivo.", "ok");
  });

  ui.refreshBtn.addEventListener("click", () => refreshAll({ forceCoords: false }));

  ui.settingsDialog.addEventListener("click", (event) => {
    const rect = ui.settingsDialog.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left && event.clientX <= rect.right &&
      event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) closeSettings();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && getKey()) {
      if (!lastRefreshAt || Date.now() - lastRefreshAt >= REFRESH_MS) {
        refreshAll({ silent: true });
      }
    }
  });

  updateGreetingAndClock();
  setInterval(updateGreetingAndClock, 30000);

  metaTimer = setInterval(updateRefreshMeta, 15000);
  refreshTimer = setInterval(() => refreshAll({ silent: true }), REFRESH_MS);


  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(console.warn);
    });
  }

  if (!getKey()) {
    setTimeout(() => openSettings({ firstRun: true }), 250);
  } else {
    refreshAll({ silent: true });
  }
})();
