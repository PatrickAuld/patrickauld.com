// src/color.ts
function parseColor(value) {
  if (value == null) return "#000000";
  if (value.length === 9 && value.startsWith("#")) {
    const a = parseInt(value.slice(1, 3), 16);
    const r = parseInt(value.slice(3, 5), 16);
    const g = parseInt(value.slice(5, 7), 16);
    const b = parseInt(value.slice(7, 9), 16);
    const alpha = Number((a / 255).toFixed(3));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return value;
}
function colorChannels(color) {
  const hex = color.replace(/^#/, "");
  const argb = hex.length === 6 ? "ff" + hex : hex;
  if (!/^[0-9a-f]{8}$/i.test(argb)) throw new Error(`Invalid WFF color: ${color}`);
  return [0, 2, 4, 6].map((i) => parseInt(argb.slice(i, i + 2), 16));
}
function mixColor(from, to, t) {
  const a = colorChannels(from), b = colorChannels(to);
  return "#" + a.map((v, i) => Math.round(Math.max(0, Math.min(255, v + (b[i] - v) * t))).toString(16).padStart(2, "0")).join("");
}
function extractColor(colors, weights, interpolate, value) {
  const list = colors.trim().split(/\s+/).filter(Boolean).map((c) => c.startsWith("#") ? c : "#" + c);
  if (!list.length) return "#00000000";
  const w = weights ? weights.trim().split(/\s+/).map(Number) : list.map(() => 1);
  if (w.length !== list.length || w.some((v) => !Number.isFinite(v) || v < 0)) throw new Error("Invalid color weights");
  const total = w.reduce((a, b) => a + b, 0);
  if (!total) return list[0];
  let position = Math.max(0, Math.min(1, value)) * total;
  for (let i = 0; i < list.length; i++) {
    if (position < w[i] || i === list.length - 1) return interpolate && i < list.length - 1 ? mixColor(list[i], list[i + 1], w[i] ? position / w[i] : 0) : list[i];
    position -= w[i];
  }
  return list.at(-1);
}

// src/styles.ts
function applyFill(ctx, el) {
  const fillEl = el.querySelector(":scope > Fill");
  if (!fillEl) return;
  const gradient = createGradient(ctx, fillEl);
  if (gradient) {
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = parseColor(fillEl.getAttribute("color"));
  }
  ctx.fill();
}
function applyStroke(ctx, el) {
  const strokeEl = el.querySelector(":scope > Stroke");
  if (!strokeEl) return;
  ctx.strokeStyle = createGradient(ctx, strokeEl) ?? parseColor(strokeEl.getAttribute("color"));
  ctx.lineWidth = parseFloat(strokeEl.getAttribute("thickness") ?? "1");
  const cap = strokeEl.getAttribute("cap");
  if (cap === "ROUND") ctx.lineCap = "round";
  else if (cap === "SQUARE") ctx.lineCap = "square";
  else ctx.lineCap = "butt";
  ctx.lineJoin = strokeJoin(strokeEl);
  const dashAttr = strokeEl.getAttribute("dashIntervals");
  if (dashAttr) {
    ctx.setLineDash(dashAttr.split(/\s+/).map(Number));
  } else {
    ctx.setLineDash([]);
  }
  ctx.lineDashOffset = parseFloat(
    strokeEl.getAttribute("dashPhase") ?? "0"
  );
  ctx.stroke();
}
function createGradient(ctx, fillEl) {
  const linear = fillEl.querySelector(":scope > LinearGradient");
  if (linear) {
    return createLinearGradient(ctx, linear);
  }
  const radial = fillEl.querySelector(":scope > RadialGradient");
  if (radial) {
    return createRadialGradient(ctx, radial);
  }
  const sweep = fillEl.querySelector(":scope > SweepGradient");
  if (sweep) {
    return createSweepGradient(ctx, sweep);
  }
  return null;
}
function addColorStops(gradient, el, positionScale = 1) {
  const colorsAttr = el.getAttribute("colors") ?? "";
  const positionsAttr = el.getAttribute("positions") ?? "";
  const colors = colorsAttr.split(/\s+/).filter(Boolean);
  const positions = positionsAttr.split(/\s+/).filter(Boolean).map(Number);
  const clampedScale = clampStop(positionScale);
  let lastStop = 0;
  for (let i = 0; i < colors.length; i++) {
    const basePos = i < positions.length ? positions[i] : colors.length <= 1 ? 0 : i / (colors.length - 1);
    const pos = clampStop(basePos * clampedScale);
    lastStop = pos;
    gradient.addColorStop(pos, parseColor(colors[i]));
  }
  if (colors.length > 0 && clampedScale < 1 && lastStop < 1) {
    gradient.addColorStop(1, parseColor(colors.at(-1)));
  }
  return gradient;
}
function createLinearGradient(ctx, el) {
  const x0 = parseFloat(el.getAttribute("startX") ?? "0");
  const y0 = parseFloat(el.getAttribute("startY") ?? "0");
  const x1 = parseFloat(el.getAttribute("endX") ?? "0");
  const y1 = parseFloat(el.getAttribute("endY") ?? "0");
  return addColorStops(ctx.createLinearGradient(x0, y0, x1, y1), el);
}
function createRadialGradient(ctx, el) {
  const cx = parseFloat(el.getAttribute("centerX") ?? "0");
  const cy = parseFloat(el.getAttribute("centerY") ?? "0");
  const r = parseFloat(el.getAttribute("radius") ?? "0");
  return addColorStops(ctx.createRadialGradient(cx, cy, 0, cx, cy, r), el);
}
function createSweepGradient(ctx, el) {
  const cx = parseFloat(el.getAttribute("centerX") ?? "0");
  const cy = parseFloat(el.getAttribute("centerY") ?? "0");
  const startAngle = parseFloat(el.getAttribute("startAngle") ?? "0");
  const endAngle = parseFloat(el.getAttribute("endAngle") ?? "360");
  const startRad = (startAngle - 90) * Math.PI / 180;
  const sweepFraction = getSweepFraction(startAngle, endAngle);
  return addColorStops(
    ctx.createConicGradient(startRad, cx, cy),
    el,
    sweepFraction
  );
}
function getSweepFraction(startAngle, endAngle) {
  const rawSweep = endAngle - startAngle;
  if (!Number.isFinite(rawSweep) || Math.abs(rawSweep) >= 360) {
    return 1;
  }
  const normalizedSweep = (rawSweep % 360 + 360) % 360;
  return normalizedSweep === 0 ? 1 : normalizedSweep / 360;
}
function clampStop(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}
function renderWeightedStroke(ctx, el) {
  const stroke = el.querySelector(":scope > WeightedStroke");
  if (!stroke) return false;
  const colors = (stroke.getAttribute("colors") ?? "").trim().split(/\s+/).filter(Boolean);
  const interpolate = stroke.getAttribute("interpolate")?.toUpperCase() === "TRUE";
  const weights = stroke.hasAttribute("weights") ? stroke.getAttribute("weights").trim().split(/\s+/).map(Number) : colors.slice(0, interpolate ? Math.max(1, colors.length - 1) : colors.length).map(() => 1);
  if (!(colors.length === weights.length || interpolate && colors.length === weights.length + 1) || weights.some((w) => w < 0 || !Number.isFinite(w))) throw new Error("WeightedStroke colors and weights must match");
  const total = weights.reduce((a, b) => a + b, 0);
  if (!total) return true;
  const n = (name, fallback = 0) => Number(el.getAttribute(name) ?? fallback);
  const gap = Number(stroke.getAttribute("discreteGap") ?? 0);
  const line = el.tagName === "Line";
  const sx = n("startX"), sy = n("startY"), dx = n("endX") - sx, dy = n("endY") - sy;
  if (line && dx !== 0 && dy !== 0) throw new Error("WeightedStroke Line must be horizontal or vertical");
  ctx.save();
  ctx.lineWidth = Number(stroke.getAttribute("thickness") ?? 1);
  ctx.lineCap = (stroke.getAttribute("cap") ?? "BUTT").toLowerCase();
  ctx.lineJoin = strokeJoin(stroke);
  ctx.setLineDash([]);
  const direction = el.getAttribute("direction") === "COUNTER_CLOCKWISE" ? -1 : 1;
  const start = n("startAngle"), end = n("endAngle", 360);
  const raw = (end - start) * direction;
  const length = line ? Math.hypot(dx, dy) : Math.abs(raw) >= 360 ? 360 : (raw % 360 + 360) % 360;
  const usable = Math.max(0, length - gap * (weights.length - 1));
  let position = 0;
  for (let i = 0; i < weights.length; i++) {
    const segment = usable * weights[i] / total;
    ctx.beginPath();
    if (line) {
      const t0 = length ? position / length : 0, t1 = length ? (position + segment) / length : 0;
      ctx.moveTo(sx + dx * t0, sy + dy * t0);
      ctx.lineTo(sx + dx * t1, sy + dy * t1);
      if (interpolate && i + 1 < colors.length) {
        const gradient = ctx.createLinearGradient(sx + dx * t0, sy + dy * t0, sx + dx * t1, sy + dy * t1);
        gradient.addColorStop(0, parseColor(colors[i]));
        gradient.addColorStop(1, parseColor(colors[i + 1]));
        ctx.strokeStyle = gradient;
      } else ctx.strokeStyle = parseColor(colors[i]);
    } else {
      const a = (start + direction * position - 90) * Math.PI / 180, b = (start + direction * (position + segment) - 90) * Math.PI / 180;
      ctx.ellipse(n("centerX"), n("centerY"), n("width") / 2, n("height") / 2, 0, a, b, direction < 0);
      ctx.strokeStyle = parseColor(colors[i]);
      if (interpolate && i + 1 < colors.length) {
        const gradient = ctx.createConicGradient(direction > 0 ? a : b, n("centerX"), n("centerY"));
        gradient.addColorStop(0, parseColor(colors[direction > 0 ? i : i + 1]));
        gradient.addColorStop(segment / 360, parseColor(colors[direction > 0 ? i + 1 : i]));
        ctx.strokeStyle = gradient;
      }
    }
    if (segment > 0) ctx.stroke();
    position += segment + gap;
  }
  ctx.restore();
  return true;
}
function strokeJoin(el) {
  const join = el.getAttribute("join");
  return join === "ROUND" ? "round" : join === "BEVEL" ? "bevel" : "miter";
}

// src/masking.ts
var BLEND_MODE_MAP = {
  CLEAR: "destination-out",
  SRC: "copy",
  DST: "destination-over",
  SRC_OVER: "source-over",
  DST_OVER: "destination-over",
  SRC_IN: "source-in",
  DST_IN: "destination-in",
  SRC_OUT: "source-out",
  DST_OUT: "destination-out",
  SRC_ATOP: "source-atop",
  DST_ATOP: "destination-atop",
  XOR: "xor",
  PLUS: "lighter",
  MODULATE: "multiply",
  MULTIPLY: "multiply",
  SCREEN: "screen",
  OVERLAY: "overlay",
  DARKEN: "darken",
  LIGHTEN: "lighten",
  COLOR_DODGE: "color-dodge",
  COLOR_BURN: "color-burn",
  HARD_LIGHT: "hard-light",
  SOFT_LIGHT: "soft-light",
  DIFFERENCE: "difference",
  EXCLUSION: "exclusion",
  HUE: "hue",
  SATURATION: "saturation",
  COLOR: "color",
  LUMINOSITY: "luminosity"
};
function applyBlendMode(ctx, el) {
  const mode = el.getAttribute("blendMode");
  if (mode && BLEND_MODE_MAP[mode]) {
    ctx.globalCompositeOperation = BLEND_MODE_MAP[mode];
  }
}
function hasMasking(el) {
  for (const child of el.children) {
    const rm = child.getAttribute("renderMode");
    if (rm === "ALL" || rm === "MASK") return true;
  }
  return false;
}
async function renderWithMasking(ctx, el, width, height, renderChild, renderCtx) {
  const source = new OffscreenCanvas(Math.max(1, width), Math.max(1, height));
  const mask = new OffscreenCanvas(Math.max(1, width), Math.max(1, height));
  const sourceCtx = source.getContext("2d"), maskCtx = mask.getContext("2d");
  const basis = renderCtx.basis ? renderCtx.basis.multiply(ctx.getTransform()) : ctx.getTransform();
  const local = { ...renderCtx, basis };
  for (const child of el.children) {
    const mode = child.getAttribute("renderMode") ?? "SOURCE";
    if (mode === "SOURCE" || mode === "ALL") await renderChild(sourceCtx, child, local);
    if (mode === "MASK" || mode === "ALL") await renderChild(maskCtx, child, { ...local, register: void 0 });
  }
  sourceCtx.globalCompositeOperation = "destination-in";
  sourceCtx.drawImage(mask, 0, 0);
  ctx.drawImage(source, 0, 0);
}

// src/layout.ts
async function renderGroup(ctx, el, renderChild, renderCtx) {
  const w = Number(el.getAttribute("width") ?? ctx.canvas.width), h = Number(el.getAttribute("height") ?? ctx.canvas.height);
  const children = async (target) => {
    if (hasMasking(el)) await renderWithMasking(target, el, w, h, renderChild, renderCtx);
    else for (const child of el.children) await renderChild(target, child, renderCtx);
  };
  await children(ctx);
}

// src/calendar.ts
var metricsCache = /* @__PURE__ */ new Map();
function calendarMetrics(wallDate, calendar) {
  const key = `${calendar}:${wallDate}`;
  const cached = metricsCache.get(key);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", calendar, year: "numeric", month: "numeric", day: "numeric", era: "short" });
  function fields(date) {
    const parts = formatter.formatToParts(new Date(date));
    const value = (type) => parts.find((p) => p.type === type)?.value ?? "";
    const monthText = value("month"), yearText = value("relatedYear") || value("year");
    const hebrew = ["Tishri", "Heshvan", "Kislev", "Tevet", "Shevat", "Adar I", "Adar", "Nisan", "Iyar", "Sivan", "Tamuz", "Av", "Elul"];
    const month = calendar === "hebrew" ? hebrew.indexOf(monthText) + 1 : parseInt(monthText);
    return { year: Number(yearText), yearKey: `${value("era")}:${yearText}`, month, monthText, day: Number(value("day")) };
  }
  const today = fields(wallDate), dayMs = 864e5;
  let yearStart = wallDate, nextYearStart = wallDate + dayMs, monthStart = wallDate, monthEnd = wallDate + dayMs;
  for (let n = 0; n < 400 && fields(yearStart - dayMs).yearKey === today.yearKey; n++) yearStart -= dayMs;
  for (let n = 0; n < 400 && fields(nextYearStart).yearKey === today.yearKey; n++) nextYearStart += dayMs;
  const sameMonth = (date) => {
    const f = fields(date);
    return f.yearKey === today.yearKey && f.monthText === today.monthText;
  };
  for (let n = 0; n < 35 && sameMonth(monthStart - dayMs); n++) monthStart -= dayMs;
  for (let n = 0; n < 35 && sameMonth(monthEnd); n++) monthEnd += dayMs;
  const result = { year: today.year, month: today.month, day: today.day, dayOfYear: 1 + (wallDate - yearStart) / dayMs, daysInMonth: (monthEnd - monthStart) / dayMs, yearStart, nextYearStart, monthStart };
  if (metricsCache.size >= 256) metricsCache.clear();
  metricsCache.set(key, result);
  return result;
}

// src/format.ts
function formatDate(pattern, timestamp, ctx, best = false) {
  const date = new Date(timestamp);
  const base = { timeZone: ctx.timeZone, calendar: ctx.calendar };
  const locale = ctx.locale ?? "en-US";
  const part = (type, options) => new Intl.DateTimeFormat(locale, { ...base, ...options }).formatToParts(date).find((p) => p.type === type)?.value ?? "";
  const numericPart = (type, options) => Number(new Intl.DateTimeFormat("en-US", { ...base, ...options }).formatToParts(date).find((p) => p.type === type)?.value ?? 0);
  const hour = numericPart("hour", { hour: "numeric", hourCycle: "h23" });
  const minute = numericPart("minute", { minute: "numeric" });
  const second = numericPart("second", { second: "numeric" });
  const numeric = (value, n) => new Intl.NumberFormat(locale, { useGrouping: false, minimumIntegerDigits: n }).format(value);
  const wallParts = new Intl.DateTimeFormat("en-US", { ...base, calendar: "gregory", year: "numeric", month: "numeric", day: "numeric", weekday: "short" }).formatToParts(date);
  const field = (name) => Number(wallParts.find((p) => p.type === name)?.value);
  const wall = new Date(Date.UTC(field("year"), field("month") - 1, field("day")));
  let dayOfYear = Math.floor((wall.getTime() - Date.UTC(field("year"), 0, 0)) / 864e5);
  if (ctx.calendar && ctx.calendar !== "gregory" && ctx.calendar !== "iso8601") dayOfYear = calendarMetrics(wall.getTime(), ctx.calendar).dayOfYear;
  const localeInfo = new Intl.Locale(locale);
  const weekInfo = localeInfo.getWeekInfo?.() ?? localeInfo.weekInfo ?? { firstDay: 7, minimalDays: 1 };
  const firstDay = weekInfo.firstDay % 7;
  const region = localeInfo.maximize().region ?? "US";
  const minimalDays = weekInfo.minimalDays ?? ("AD AT BE BG CH CZ DE DK EE ES FI FR GB GR IE IS IT LI LT LU MC NL NO PL PT RU SE SK".split(" ").includes(region) ? 4 : 1);
  const weekStart = (year, month) => {
    const start = Date.UTC(year, month, 1), before = (new Date(start).getUTCDay() - firstDay + 7) % 7;
    return start - before * 864e5 + (7 - before < minimalDays ? 6048e5 : 0);
  };
  let weekYear = field("year");
  if (wall.getTime() < weekStart(weekYear, 0)) weekYear--;
  else if (wall.getTime() >= weekStart(weekYear + 1, 0)) weekYear++;
  const weekInYear = 1 + Math.floor((wall.getTime() - weekStart(weekYear, 0)) / 6048e5);
  const zoneOffset = part("timeZoneName", { timeZoneName: "longOffset" }).match(/GMT([+-])(\d\d):(\d\d)/);
  const offset = zoneOffset ? (zoneOffset[1] === "-" ? -1 : 1) * (Number(zoneOffset[2]) * 60 + Number(zoneOffset[3])) : 0;
  const offsetText = (colon) => `${offset < 0 ? "-" : "+"}${String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0")}${colon ? ":" : ""}${String(Math.abs(offset) % 60).padStart(2, "0")}`;
  const tokens = pattern.match(/('[^']*(?:''[^']*)*'|[a-zA-Z]+|[^a-zA-Z']+)/g) ?? [];
  if (best) {
    const options = { ...base };
    if (/y/.test(pattern)) options.year = "numeric";
    if (/M|L/.test(pattern)) options.month = /MMMM|LLLL/.test(pattern) ? "long" : /MMM|LLL/.test(pattern) ? "short" : "numeric";
    if (/d/.test(pattern)) options.day = "numeric";
    if (/E|c/.test(pattern)) options.weekday = /EEEE/.test(pattern) ? "long" : "short";
    if (/h|H|K|k|j|J|C/.test(pattern)) {
      options.hour = "numeric";
      if (!/j|J|C/.test(pattern)) options.hour12 = /h|K/.test(pattern);
    }
    if (/m/.test(pattern)) options.minute = "2-digit";
    if (/s/.test(pattern)) options.second = "2-digit";
    return new Intl.DateTimeFormat(locale, options).format(date);
  }
  return tokens.map((t) => {
    if (t === "''") return "'";
    if (t.startsWith("'")) return t.slice(1, -1).replace(/''/g, "'");
    return t.replace(/([a-zA-Z])\1*/g, (token, char) => {
      const n = token.length;
      switch (char) {
        case "y": {
          const y = part("year", { year: n === 2 ? "2-digit" : "numeric" });
          return /^\d+$/.test(y) ? y.padStart(n, "0") : y;
        }
        case "Y":
          return numeric(n === 2 ? weekYear % 100 : weekYear, n);
        case "u":
        case "r":
          return numeric(field("year"), n);
        case "U":
          return part("yearName", { year: "numeric" }) || part("year", { year: "numeric" });
        case "M":
        case "L":
          return part("month", { month: n === 5 ? "narrow" : n >= 4 ? "long" : n === 3 ? "short" : n === 2 ? "2-digit" : "numeric" });
        case "d":
          return part("day", { day: n === 2 ? "2-digit" : "numeric" });
        case "E":
          return part("weekday", { weekday: n === 5 ? "narrow" : n === 4 ? "long" : "short" });
        case "e":
        case "c":
          return n <= 2 ? numeric((wall.getUTCDay() - firstDay + 7) % 7 + 1, n) : part("weekday", { weekday: n === 5 ? "narrow" : n === 4 ? "long" : "short" });
        case "D":
          return numeric(dayOfYear, n);
        case "F":
          return numeric(Math.ceil(field("day") / 7), n);
        case "w":
          return numeric(weekInYear, n);
        case "W":
          return numeric(Math.max(0, 1 + Math.floor((wall.getTime() - weekStart(field("year"), field("month") - 1)) / 6048e5)), n);
        case "g":
          return numeric(Math.floor(wall.getTime() / 864e5) + 40587, n);
        case "Q":
        case "q": {
          const quarter = Math.ceil(field("month") / 3);
          return n <= 2 ? numeric(quarter, n) : n === 3 ? `Q${quarter}` : `${quarter}${["st", "nd", "rd", "th"][quarter - 1]} quarter`;
        }
        case "j":
        case "J":
        case "C":
          return part("hour", { hour: n === 2 ? "2-digit" : "numeric" });
        case "H":
          return numeric(hour, n);
        case "h":
          return numeric(hour % 12 || 12, n);
        case "K":
          return numeric(hour % 12, n);
        case "k":
          return numeric(hour || 24, n);
        case "m":
          return numeric(minute, n);
        case "s":
          return numeric(second, n);
        case "S":
          return String(date.getMilliseconds()).padStart(3, "0").slice(0, n).padEnd(n, "0");
        case "A":
          return numeric(hour * 36e5 + minute * 6e4 + second * 1e3 + date.getMilliseconds(), n);
        case "B":
        case "b":
          return part("dayPeriod", { hour: "numeric", hour12: true, dayPeriod: n >= 4 ? "long" : "short" });
        case "a":
          return part("dayPeriod", { hour: "numeric", hour12: true });
        case "X":
        case "x":
          return char === "X" && offset === 0 ? "Z" : n === 1 && offset % 60 === 0 ? offsetText(false).slice(0, 3) : offsetText(n === 3 || n === 5);
        case "Z":
          return n === 4 ? "GMT" + offsetText(true) : n >= 5 && offset === 0 ? "Z" : offsetText(n >= 5);
        case "O":
          return "GMT" + offsetText(true);
        case "V":
          return n === 2 ? ctx.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone : part("timeZoneName", { timeZoneName: n >= 4 ? "longGeneric" : "shortGeneric" });
        case "z":
        case "v":
          return part("timeZoneName", { timeZoneName: n >= 4 ? "long" : "short" });
        case "G":
          return part("era", { era: n >= 4 ? "long" : "short", year: "numeric" });
        default:
          return token;
      }
    });
  }).join("");
}
function formatNumber(pattern, value, locale = "en-US", currency) {
  let quoted = false, split = -1;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === "'") {
      if (pattern[i + 1] === "'") i++;
      else quoted = !quoted;
    } else if (pattern[i] === ";" && !quoted) {
      split = i;
      break;
    }
  }
  const explicitNegative = value < 0 && split >= 0;
  const subpattern = explicitNegative ? pattern.slice(split + 1) : split >= 0 ? pattern.slice(0, split) : pattern;
  let mask = "", inside = false;
  for (let i = 0; i < subpattern.length; i++) {
    if (subpattern[i] === "'") {
      if (subpattern[i + 1] === "'") {
        mask += "  ";
        i++;
      } else {
        inside = !inside;
        mask += " ";
      }
    } else mask += inside ? " " : subpattern[i];
  }
  const match = mask.match(/[0#][0#,]*(?:\.[0#]*)?(?:E\+?0+)?/);
  if (!match) return String(value);
  const [mantissaPattern, exponentPattern] = match[0].split("E"), [integer, fraction = ""] = mantissaPattern.split(".");
  const percent = mask.includes("%"), perMille = mask.includes("\u2030");
  let scaled = Math.abs(value) * (percent ? 100 : perMille ? 1e3 : 1), exponent = 0;
  const minInteger = Math.max(1, (integer.match(/0/g) ?? []).length), maxInteger = integer.replace(/,/g, "").length;
  if (exponentPattern && scaled > 0 && Number.isFinite(scaled)) {
    const magnitude = Math.floor(Math.log10(scaled));
    exponent = maxInteger > minInteger && maxInteger > 1 ? Math.floor(magnitude / maxInteger) * maxInteger : magnitude - minInteger + 1;
    scaled /= 10 ** exponent;
  }
  const opts = {
    useGrouping: integer.includes(","),
    minimumIntegerDigits: minInteger,
    minimumFractionDigits: (fraction.match(/0/g) ?? []).length,
    maximumFractionDigits: fraction.length,
    roundingMode: "halfEven"
  };
  let rendered = new Intl.NumberFormat(locale, opts).format(scaled);
  if (exponentPattern) rendered += "E" + (exponent < 0 ? "-" : exponentPattern.startsWith("+") ? "+" : "") + new Intl.NumberFormat(locale, { useGrouping: false, minimumIntegerDigits: exponentPattern.replace("+", "").length }).format(Math.abs(exponent));
  const region = new Intl.Locale(locale).maximize().region ?? "US";
  const currencies = { US: "USD", GB: "GBP", JP: "JPY", CN: "CNY", KR: "KRW", IN: "INR", CA: "CAD", AU: "AUD", NZ: "NZD", CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", BR: "BRL", MX: "MXN", RU: "RUB", ZA: "ZAR", TW: "TWD", HK: "HKD", SG: "SGD", TH: "THB", ID: "IDR", AE: "AED", SA: "SAR", IL: "ILS", PL: "PLN", CZ: "CZK", HU: "HUF", TR: "TRY" };
  const code = currency ?? currencies[region] ?? ("AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK".split(" ").includes(region) ? "EUR" : "XXX");
  const currencySymbol = () => new Intl.NumberFormat(locale, { style: "currency", currency: code }).formatToParts(0).find((p) => p.type === "currency")?.value ?? code;
  const affix = (text) => {
    let result = "", quote = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === "'") {
        if (text[i + 1] === "'") {
          result += "'";
          i++;
        } else quote = !quote;
      } else if (!quote && c === "\xA4") {
        if (text[i + 1] === "\xA4") {
          result += code;
          i++;
        } else result += currencySymbol();
      } else result += c;
    }
    return result;
  };
  const at = match.index;
  return (value < 0 && !explicitNegative ? "-" : "") + affix(subpattern.slice(0, at)) + rendered + affix(subpattern.slice(at + match[0].length));
}
function formatTemplate(pattern, values, ctx = { sources: {} }) {
  let index = 0, previous = 0;
  const locale = ctx.locale ?? "en-US";
  return pattern.replace(
    /%(?:(\d+)\$)?([-+ 0,(#<]*)(\d+)?(?:\.(\d+))?([sSdDfFeEgGaAxXoOhHbcBn%]|[tT][a-zA-Z])/g,
    (_all, position, flags, width, precision, type) => {
      if (type === "%") return "%".padStart(Number(width ?? 0), " ");
      if (type === "n") return "\n";
      const at = flags.includes("<") ? previous : position ? Number(position) - 1 : index++;
      previous = at;
      const value = values[at] ?? "";
      const number2 = Number(value), absolute = Math.abs(number2), digits = Number(precision ?? 6);
      let result, numeric = false;
      if (/^[tT]/.test(type)) {
        const token = type[1], formats = { H: "HH", I: "hh", k: "H", l: "h", M: "mm", S: "ss", L: "SSS", N: "SSSSSSSSS", p: "a", z: "Z", Z: "z", B: "MMMM", b: "MMM", h: "MMM", A: "EEEE", a: "EEE", C: "yy", Y: "yyyy", y: "yy", j: "DDD", m: "MM", d: "dd", e: "d", R: "HH:mm", T: "HH:mm:ss", r: "hh:mm:ss a", D: "MM/dd/yy", F: "yyyy-MM-dd", c: "EEE MMM dd HH:mm:ss z yyyy" };
        result = token === "Q" ? String(number2) : token === "s" ? String(Math.floor(number2 / 1e3)) : token === "C" ? String(Math.floor(Number(formatDate("yyyy", number2, { ...ctx, locale: "en-US" })) / 100)).padStart(2, "0") : formatDate(formats[token] ?? token, number2, ctx);
        if (token === "p") result = result.toLocaleLowerCase(locale);
      } else switch (type.toLowerCase()) {
        case "d":
          numeric = true;
          result = new Intl.NumberFormat(locale, { useGrouping: flags.includes(","), maximumFractionDigits: 0 }).format(Math.trunc(absolute));
          break;
        case "f":
          numeric = true;
          result = new Intl.NumberFormat(locale, { useGrouping: flags.includes(","), minimumFractionDigits: digits, maximumFractionDigits: digits }).format(absolute);
          if (flags.includes("#") && digits === 0) result += ".";
          break;
        case "e":
          numeric = true;
          result = absolute.toExponential(digits).replace(/e([+-])(\d)$/, "e$10$2");
          break;
        case "g": {
          numeric = true;
          const significant = Math.max(1, digits), exponent = absolute ? Math.floor(Math.log10(absolute)) : 0;
          result = exponent < -4 || exponent >= significant ? absolute.toExponential(significant - 1).replace(/e([+-])(\d)$/, "e$10$2") : absolute.toFixed(Math.max(0, significant - exponent - 1));
          break;
        }
        case "a": {
          numeric = true;
          if (absolute === 0) result = "0x0.0p0";
          else if (!Number.isFinite(absolute)) result = String(absolute);
          else {
            const data = new DataView(new ArrayBuffer(8));
            data.setFloat64(0, absolute);
            const bits = data.getBigUint64(0), rawExponent = Number(bits >> 52n & 2047n), fraction = (bits & (1n << 52n) - 1n).toString(16).padStart(13, "0").replace(/0+$/, "") || "0";
            result = `0x${rawExponent ? 1 : 0}.${precision ? fraction.slice(0, digits).padEnd(digits, "0") : fraction}p${rawExponent ? rawExponent - 1023 : -1022}`;
          }
          break;
        }
        case "x":
        case "o":
          numeric = true;
          result = Math.trunc(number2 < 0 ? number2 >>> 0 : number2).toString(type.toLowerCase() === "x" ? 16 : 8);
          if (flags.includes("#")) result = (type.toLowerCase() === "x" ? "0x" : "0") + result;
          break;
        case "h": {
          let hash = typeof value === "number" ? Math.trunc(value) : 0;
          if (typeof value === "string") for (let i = 0; i < value.length; i++) hash = 31 * hash + value.charCodeAt(i) | 0;
          result = (hash >>> 0).toString(16);
          break;
        }
        case "b":
          result = String(Boolean(value));
          break;
        case "c":
          result = typeof value === "number" ? String.fromCodePoint(value) : String(value).charAt(0);
          break;
        default:
          result = String(value);
          if (precision) result = result.slice(0, Number(precision));
      }
      if (numeric && !/[xo]/i.test(type)) {
        if (number2 < 0) result = flags.includes("(") ? `(${result})` : "-" + result;
        else if (flags.includes("+")) result = "+" + result;
        else if (flags.includes(" ")) result = " " + result;
      }
      if (type[0] === type[0].toUpperCase()) result = result.toLocaleUpperCase(locale);
      const count = Number(width ?? 0);
      if (flags.includes("-")) return result.padEnd(count, " ");
      if (flags.includes("0") && numeric && result.length < count) {
        const match = result.match(/^([-+ (]?)(0[xX])?(.*?)(\)?)$/);
        return match[1] + (match[2] ?? "") + match[3].padStart(count - match[1].length - (match[2]?.length ?? 0) - match[4].length, "0") + match[4];
      }
      return result.padStart(count, " ");
    }
  );
}
function formatTime(pattern, timestamp, ctx, hourFormat = "SYNC_TO_DEVICE") {
  const use24 = hourFormat === "24" || hourFormat === "SYNC_TO_DEVICE" && Boolean(ctx.sources.IS_24_HOUR_MODE);
  const markers = [];
  const converted = pattern.replace(/'[^']*(?:''[^']*)*'|[hH]+(?:_10|_1)?|[ms]+(?:_10|_1)?/g, (token) => {
    if (token.startsWith("'")) return token;
    const digit = token.match(/^(h+|H+|m+|s+)_(10|1)$/);
    const normalized = token.replace(/[hH]/g, use24 ? "H" : "h");
    if (!digit) return normalized;
    const value = Number(formatDate(normalized.split("_")[0], timestamp, { ...ctx, locale: "en-US" }));
    markers.push(String(digit[2] === "10" ? Math.floor(value / 10) : value % 10));
    return "'~" + (markers.length - 1) + "~'";
  });
  return formatDate(converted, timestamp, ctx).replace(/~(\d+)~/g, (_, i) => markers[Number(i)]);
}

// src/expressions.ts
function tokenize(input) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    if (/\s/.test(input[i])) {
      i++;
      continue;
    }
    if (input[i] === "[") {
      const end = input.indexOf("]", i);
      if (end === -1) throw new Error(`Unterminated source reference at ${i}`);
      tokens.push({ type: "source", value: input.slice(i + 1, end) });
      i = end + 1;
      continue;
    }
    if (input[i] === "#") {
      const hex = input.slice(i).match(/^#[0-9a-fA-F]{8}(?![0-9a-fA-F])|^#[0-9a-fA-F]{6}(?![0-9a-fA-F])/);
      if (!hex) throw new Error(`Invalid color at ${i}`);
      tokens.push({ type: "string", value: hex[0] });
      i += hex[0].length;
      continue;
    }
    if (input[i] === '"' || input[i] === "'") {
      const quote = input[i];
      let str = "";
      i++;
      while (i < input.length && input[i] !== quote) {
        if (input[i] === "\\" && i + 1 < input.length) {
          i++;
          str += input[i];
        } else {
          str += input[i];
        }
        i++;
      }
      if (i === input.length) throw new Error("Unterminated string literal");
      i++;
      tokens.push({ type: "string", value: str });
      continue;
    }
    if (/[0-9]/.test(input[i]) || input[i] === "." && /[0-9]/.test(input[i + 1] ?? "")) {
      let num = "";
      while (i < input.length && /[0-9.]/.test(input[i])) {
        num += input[i];
        i++;
      }
      tokens.push({ type: "number", value: parseFloat(num) });
      continue;
    }
    const two = input.slice(i, i + 2);
    if (two === "==" || two === "!=" || two === "<=" || two === ">=" || two === "&&" || two === "||") {
      tokens.push({ type: two, value: two });
      i += 2;
      continue;
    }
    const ch = input[i];
    if ("+-*/%<>!~|&?:(),".includes(ch)) {
      tokens.push({ type: ch, value: ch });
      i++;
      continue;
    }
    if (/[a-zA-Z_]/.test(input[i])) {
      let ident = "";
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        ident += input[i];
        i++;
      }
      tokens.push({ type: "ident", value: ident });
      continue;
    }
    throw new Error(`Unexpected character '${input[i]}' at position ${i}`);
  }
  return tokens;
}
var Parser = class {
  tokens;
  pos;
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }
  peek() {
    return this.tokens[this.pos];
  }
  consume() {
    const tok = this.tokens[this.pos];
    if (!tok) throw new Error("Unexpected end of expression");
    this.pos++;
    return tok;
  }
  expect(type) {
    const tok = this.consume();
    if (tok.type !== type) {
      throw new Error(`Expected token '${type}', got '${tok.type}'`);
    }
    return tok;
  }
  parse() {
    const node = this.parseTernary();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token '${this.tokens[this.pos].value}' at position ${this.pos}`);
    }
    return node;
  }
  // Ternary: condition ? consequent : alternate
  parseTernary() {
    const condition = this.parseOr();
    if (this.peek()?.type === "?") {
      this.consume();
      const consequent = this.parseTernary();
      this.expect(":");
      const alternate = this.parseTernary();
      return { type: "ternary", condition, consequent, alternate };
    }
    return condition;
  }
  // Logical OR
  parseOr() {
    let left = this.parseAnd();
    while (this.peek()?.type === "||") {
      const op = this.consume().type;
      const right = this.parseAnd();
      left = { type: "binary", op, left, right };
    }
    return left;
  }
  // Logical AND
  parseAnd() {
    let left = this.parseBitwiseOr();
    while (this.peek()?.type === "&&") {
      const op = this.consume().type;
      const right = this.parseBitwiseOr();
      left = { type: "binary", op, left, right };
    }
    return left;
  }
  // Bitwise OR
  parseBitwiseOr() {
    let left = this.parseBitwiseAnd();
    while (this.peek()?.type === "|") {
      const op = this.consume().type;
      const right = this.parseBitwiseAnd();
      left = { type: "binary", op, left, right };
    }
    return left;
  }
  // Bitwise AND
  parseBitwiseAnd() {
    let left = this.parseEquality();
    while (this.peek()?.type === "&") {
      const op = this.consume().type;
      const right = this.parseEquality();
      left = { type: "binary", op, left, right };
    }
    return left;
  }
  // Equality: == !=
  parseEquality() {
    let left = this.parseComparison();
    while (this.peek()?.type === "==" || this.peek()?.type === "!=") {
      const op = this.consume().type;
      const right = this.parseComparison();
      left = { type: "binary", op, left, right };
    }
    return left;
  }
  // Comparison: < <= > >=
  parseComparison() {
    let left = this.parseAddition();
    while (this.peek()?.type === "<" || this.peek()?.type === "<=" || this.peek()?.type === ">" || this.peek()?.type === ">=") {
      const op = this.consume().type;
      const right = this.parseAddition();
      left = { type: "binary", op, left, right };
    }
    return left;
  }
  // Addition: + -
  parseAddition() {
    let left = this.parseMultiplication();
    while (this.peek()?.type === "+" || this.peek()?.type === "-") {
      const op = this.consume().type;
      const right = this.parseMultiplication();
      left = { type: "binary", op, left, right };
    }
    return left;
  }
  // Multiplication: * / %
  parseMultiplication() {
    let left = this.parseUnary();
    while (this.peek()?.type === "*" || this.peek()?.type === "/" || this.peek()?.type === "%") {
      const op = this.consume().type;
      const right = this.parseUnary();
      left = { type: "binary", op, left, right };
    }
    return left;
  }
  // Unary: ! - ~
  parseUnary() {
    const tok = this.peek();
    if (tok?.type === "!" || tok?.type === "+" || tok?.type === "-" || tok?.type === "~") {
      this.consume();
      const operand = this.parseUnary();
      return { type: "unary", op: tok.type, operand };
    }
    return this.parsePrimary();
  }
  parseArgument(name, index) {
    const first = this.parseTernary();
    const list = name === "extractColorFromColors" && index === 0 || name === "extractColorFromWeightedColors" && index < 2;
    if (!list) return first;
    const items = [first];
    while (this.peek() && this.peek().type !== "," && this.peek().type !== ")") items.push(this.parseTernary());
    return items.length === 1 ? first : { type: "list", items };
  }
  // Primary: number, string, source ref, function call, parenthesized
  parsePrimary() {
    const tok = this.peek();
    if (!tok) throw new Error("Unexpected end of expression");
    if (tok.type === "number") {
      this.consume();
      return { type: "number", value: tok.value };
    }
    if (tok.type === "string") {
      this.consume();
      return { type: "string", value: tok.value };
    }
    if (tok.type === "source") {
      this.consume();
      return { type: "source", name: tok.value };
    }
    if (tok.type === "ident") {
      this.consume();
      const name = tok.value;
      if (name === "true" || name === "TRUE") return { type: "number", value: 1 };
      if (name === "false" || name === "FALSE") return { type: "number", value: 0 };
      if (this.peek()?.type === "(") {
        this.consume();
        const args = [];
        if (this.peek()?.type !== ")") {
          args.push(this.parseArgument(name, args.length));
          while (this.peek()?.type === ",") {
            this.consume();
            args.push(this.parseArgument(name, args.length));
          }
        }
        this.expect(")");
        return { type: "call", name, args };
      }
      return { type: "string", value: name };
    }
    if (tok.type === "(") {
      this.consume();
      const node = this.parseTernary();
      this.expect(")");
      return node;
    }
    throw new Error(`Unexpected token '${tok.value}' (${tok.type})`);
  }
};
function numArg(args, i, fname) {
  const v = args[i];
  if (typeof v !== "number") throw new Error(`${fname}: argument ${i} must be a number, got ${v}`);
  return v;
}
var BUILTINS = {
  cbrt: (a) => Math.cbrt(Number(a[0])),
  expm1: (a) => Math.expm1(Number(a[0])),
  atan2: (a) => Math.atan2(Number(a[0]), Number(a[1])),
  colorRgb: (a) => "#" + a.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(255, Number(v)))).toString(16).padStart(2, "0")).join(""),
  colorArgb: (a) => "#" + a.slice(0, 4).map((v) => Math.round(Math.max(0, Math.min(255, Number(v)))).toString(16).padStart(2, "0")).join(""),
  extractColorFromColors: (a) => extractColor(String(a[0]), void 0, Boolean(a[1]), Number(a[2])),
  extractColorFromWeightedColors: (a) => extractColor(String(a[0]), String(a[1]), Boolean(a[2]), Number(a[3])),
  round: (a) => Math.round(numArg(a, 0, "round")),
  floor: (a) => Math.floor(numArg(a, 0, "floor")),
  ceil: (a) => Math.ceil(numArg(a, 0, "ceil")),
  fract: (a) => {
    const x = numArg(a, 0, "fract");
    return x - Math.floor(x);
  },
  abs: (a) => Math.abs(numArg(a, 0, "abs")),
  sqrt: (a) => Math.sqrt(numArg(a, 0, "sqrt")),
  pow: (a) => Math.pow(numArg(a, 0, "pow"), numArg(a, 1, "pow")),
  sin: (a) => Math.sin(numArg(a, 0, "sin")),
  cos: (a) => Math.cos(numArg(a, 0, "cos")),
  tan: (a) => Math.tan(numArg(a, 0, "tan")),
  asin: (a) => Math.asin(numArg(a, 0, "asin")),
  acos: (a) => Math.acos(numArg(a, 0, "acos")),
  atan: (a) => Math.atan(numArg(a, 0, "atan")),
  deg: (a) => numArg(a, 0, "deg") * (180 / Math.PI),
  rad: (a) => numArg(a, 0, "rad") * (Math.PI / 180),
  clamp: (a) => {
    const x = numArg(a, 0, "clamp");
    const min = numArg(a, 1, "clamp");
    const max = numArg(a, 2, "clamp");
    return Math.min(Math.max(x, min), max);
  },
  log: (a) => Math.log(numArg(a, 0, "log")),
  log2: (a) => Math.log2(numArg(a, 0, "log2")),
  log10: (a) => Math.log10(numArg(a, 0, "log10")),
  exp: (a) => Math.exp(numArg(a, 0, "exp")),
  numberFormat: (a) => {
    const value = numArg(a, 0, "numberFormat");
    const minIntDigits = numArg(a, 1, "numberFormat");
    return String(Math.trunc(value)).padStart(minIntDigits, "0");
  },
  subText: (a) => {
    const str = String(a[0]);
    const start = numArg(a, 1, "subText");
    const end = numArg(a, 2, "subText");
    return str.slice(start, end);
  },
  textLength: (a) => String(a[0]).length,
  icuText: (a) => String(a[0])
  // return the pattern as-is
};
function evalNode(node, ctx) {
  switch (node.type) {
    case "number":
      return node.value;
    case "string":
      return node.value;
    case "source": {
      const val = ctx.sources[node.name];
      if (val === void 0) {
        return 0;
      }
      return val;
    }
    case "unary": {
      const operand = evalNode(node.operand, ctx);
      switch (node.op) {
        case "!":
          return Number(!operand);
        case "+":
          return Number(operand);
        case "-":
          return -operand;
        case "~":
          return ~operand;
        default:
          throw new Error(`Unknown unary operator: ${node.op}`);
      }
    }
    case "binary": {
      const left = evalNode(node.left, ctx);
      if (node.op === "&&" && !left) return 0;
      if (node.op === "||" && left) return 1;
      const right = evalNode(node.right, ctx);
      switch (node.op) {
        case "+":
          if (typeof left === "string" || typeof right === "string") {
            return String(left) + String(right);
          }
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          return Number(right) === 0 ? 0 : Number(left) / Number(right);
        case "%":
          return Number(right) === 0 ? 0 : Number(left) % Number(right);
        case "==":
          return left == right ? 1 : 0;
        case "!=":
          return left != right ? 1 : 0;
        case "<":
          return left < right ? 1 : 0;
        case "<=":
          return left <= right ? 1 : 0;
        case ">":
          return left > right ? 1 : 0;
        case ">=":
          return left >= right ? 1 : 0;
        case "&&":
          return left && right ? 1 : 0;
        case "||":
          return left || right ? 1 : 0;
        case "|":
          return left | right;
        case "&":
          return left & right;
        default:
          throw new Error(`Unknown binary operator: ${node.op}`);
      }
    }
    case "ternary": {
      const cond = evalNode(node.condition, ctx);
      return cond ? evalNode(node.consequent, ctx) : evalNode(node.alternate, ctx);
    }
    case "list":
      return node.items.map((item) => evalNode(item, ctx)).join(" ");
    case "call": {
      const args = node.args.map((a) => evalNode(a, ctx));
      if (node.name === "icuText" || node.name === "icuBestText") return formatDate(String(args[0]), Number(args[1] ?? ctx.sources.UTC_TIMESTAMP ?? Date.now()), ctx, node.name === "icuBestText");
      if (node.name === "numberFormat" && typeof args[0] === "string") return formatNumber(args[0], Number(args[1]), ctx.locale, ctx.currency);
      if (node.name === "rand") return Number(args[0]) + (Number(args[1]) - Number(args[0])) * (ctx.random ?? Math.random)();
      const fn = BUILTINS[node.name];
      if (!fn) throw new Error(`Unknown function: ${node.name}`);
      return fn(args);
    }
  }
}
function evaluateExpression(expr, context) {
  const tokens = tokenize(expr);
  const parser = new Parser(tokens);
  const ast = parser.parse();
  return evalNode(ast, context);
}
function zeroPad(value) {
  return String(value).padStart(2, "0");
}
function getDayOfYear(date) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const diff = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start;
  const oneDay = 1e3 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}
function buildDataSources(time, config, is24Hour, utcFields = false) {
  const millisecond = utcFields ? time.getUTCMilliseconds() : time.getMilliseconds();
  const second = utcFields ? time.getUTCSeconds() : time.getSeconds();
  const minute = utcFields ? time.getUTCMinutes() : time.getMinutes();
  const hour0_23 = utcFields ? time.getUTCHours() : time.getHours();
  const hour0_11 = hour0_23 % 12;
  const hour1_12 = hour0_11 === 0 ? 12 : hour0_11;
  const hour1_24 = hour0_23 === 0 ? 24 : hour0_23;
  const day = utcFields ? time.getUTCDate() : time.getDate();
  const dayOfWeek = (utcFields ? time.getUTCDay() : time.getDay()) + 1;
  const dayOfYear = utcFields ? Math.floor((Date.UTC(time.getUTCFullYear(), time.getUTCMonth(), time.getUTCDate()) - Date.UTC(time.getUTCFullYear(), 0, 0)) / 864e5) : getDayOfYear(time);
  const month = (utcFields ? time.getUTCMonth() : time.getMonth()) + 1;
  const year = utcFields ? time.getUTCFullYear() : time.getFullYear();
  const ampmState = hour0_23 >= 12 ? 1 : 0;
  const is24HourMode = is24Hour !== false ? 1 : 0;
  const utcTimestamp = time.getTime();
  const secondsSinceEpoch = Math.floor(utcTimestamp / 1e3);
  const daysInMonth = new Date(Date.UTC(year, (utcFields ? time.getUTCMonth() : time.getMonth()) + 1, 0)).getUTCDate();
  const secondMillisecond = second + millisecond / 1e3;
  const minuteSecond = minute + second / 60;
  const hour0_11Minute = hour0_11 + minute / 60;
  const hour1_12Minute = hour1_12 + minute / 60;
  const hour0_23Minute = hour0_23 + minute / 60;
  const hour1_24Minute = hour1_24 + minute / 60;
  const secondsInDay = hour0_23 * 3600 + minute * 60 + second;
  const day0_30 = day - 1;
  const dayHour = day + hour0_23 / 24;
  const day0_30Hour = day0_30 + hour0_23 / 24;
  const month0_11 = month - 1;
  const monthDay = month + day0_30 / daysInMonth;
  const month0_11Day = month0_11 + day0_30 / daysInMonth;
  const yearMonth = year + month0_11 / 12;
  const yearMonthDay = year + (month0_11 + day0_30 / daysInMonth) / 12;
  const weekInMonth = Math.ceil(day / 7);
  const weekInYear = Math.ceil(dayOfYear / 7);
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  const monthNamesShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const tzOffsetMinutes = -time.getTimezoneOffset();
  const tzOffsetHours = Math.trunc(tzOffsetMinutes / 60);
  const tzOffsetRemMin = Math.abs(tzOffsetMinutes % 60);
  const tzOffsetStr = `${tzOffsetHours >= 0 ? "+" : ""}${tzOffsetHours}${tzOffsetRemMin ? ":" + zeroPad(tzOffsetRemMin) : ""}`;
  const tzName = Intl.DateTimeFormat(void 0, { timeZoneName: "long" }).formatToParts(time).find((p) => p.type === "timeZoneName")?.value ?? "";
  const tzAbb = Intl.DateTimeFormat(void 0, { timeZoneName: "short" }).formatToParts(time).find((p) => p.type === "timeZoneName")?.value ?? "";
  const tzId = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  const sources = {
    // Milliseconds
    UTC_TIMESTAMP: utcTimestamp,
    MILLISECOND: millisecond,
    // Seconds
    SECOND: second,
    SECOND_Z: zeroPad(second),
    SECOND_TENS_DIGIT: Math.floor(second / 10),
    SECOND_UNITS_DIGIT: second % 10,
    SECOND_MILLISECOND: secondMillisecond,
    SECONDS_IN_DAY: secondsInDay,
    SECONDS_SINCE_EPOCH: secondsSinceEpoch,
    // Minutes
    MINUTE: minute,
    MINUTE_Z: zeroPad(minute),
    MINUTE_TENS_DIGIT: Math.floor(minute / 10),
    MINUTE_UNITS_DIGIT: minute % 10,
    MINUTE_SECOND: minuteSecond,
    MINUTES_SINCE_EPOCH: Math.floor(secondsSinceEpoch / 60),
    // Hours (12-hour 0-11)
    HOUR_0_11: hour0_11,
    HOUR_0_11_Z: zeroPad(hour0_11),
    HOUR_0_11_MINUTE: hour0_11Minute,
    // Hours (12-hour 1-12)
    HOUR_1_12: hour1_12,
    HOUR_1_12_Z: zeroPad(hour1_12),
    HOUR_1_12_MINUTE: hour1_12Minute,
    // Hours (24-hour 0-23)
    HOUR_0_23: hour0_23,
    HOUR_0_23_Z: zeroPad(hour0_23),
    HOUR_0_23_MINUTE: hour0_23Minute,
    HOUR_0_23_TENS_DIGIT: Math.floor(hour0_23 / 10),
    HOUR_0_23_UNITS_DIGIT: hour0_23 % 10,
    // Hours (24-hour 1-24)
    HOUR_1_24: hour1_24,
    HOUR_1_24_Z: zeroPad(hour1_24),
    HOUR_1_24_MINUTE: hour1_24Minute,
    // Hour digit extraction (depends on IS_24_HOUR_MODE)
    HOUR_TENS_DIGIT: is24HourMode ? Math.floor(hour0_23 / 10) : Math.floor(hour1_12 / 10),
    HOUR_UNITS_DIGIT: is24HourMode ? hour0_23 % 10 : hour1_12 % 10,
    HOURS_SINCE_EPOCH: Math.floor(secondsSinceEpoch / 3600),
    // Hour digit extraction for specific formats
    HOUR_1_12_TENS_DIGIT: Math.floor(hour1_12 / 10),
    HOUR_1_12_UNITS_DIGIT: hour1_12 % 10,
    HOUR_0_11_TENS_DIGIT: Math.floor(hour0_11 / 10),
    HOUR_0_11_UNITS_DIGIT: hour0_11 % 10,
    HOUR_1_24_TENS_DIGIT: Math.floor(hour1_24 / 10),
    HOUR_1_24_UNITS_DIGIT: hour1_24 % 10,
    // Days
    DAY: day,
    DAY_Z: zeroPad(day),
    DAY_HOUR: dayHour,
    DAY_0_30: day0_30,
    DAY_0_30_HOUR: day0_30Hour,
    DAY_OF_YEAR: dayOfYear,
    DAY_OF_WEEK: dayOfWeek,
    DAY_OF_WEEK_F: dayNames[utcFields ? time.getUTCDay() : time.getDay()],
    DAY_OF_WEEK_S: dayNamesShort[utcFields ? time.getUTCDay() : time.getDay()],
    FIRST_DAY_OF_WEEK: 1,
    // default to Sunday; no browser API for locale first day
    // Months
    MONTH: month,
    MONTH_Z: zeroPad(month),
    MONTH_F: monthNames[utcFields ? time.getUTCMonth() : time.getMonth()],
    MONTH_S: monthNamesShort[utcFields ? time.getUTCMonth() : time.getMonth()],
    DAYS_IN_MONTH: daysInMonth,
    MONTH_DAY: monthDay,
    MONTH_0_11: month0_11,
    MONTH_0_11_DAY: month0_11Day,
    // Years
    YEAR: year,
    YEAR_S: year % 100,
    YEAR_MONTH: yearMonth,
    YEAR_MONTH_DAY: yearMonthDay,
    // Weeks
    WEEK_IN_MONTH: weekInMonth,
    WEEK_IN_YEAR: weekInYear,
    // AM/PM and mode
    AMPM_STATE: ampmState,
    IS_24_HOUR_MODE: is24HourMode,
    // Daylight saving time
    IS_DAYLIGHT_SAVING_TIME: isDST(time) ? 1 : 0,
    // Timezone
    TIMEZONE: tzName,
    TIMEZONE_ABB: tzAbb,
    TIMEZONE_ID: tzId,
    TIMEZONE_OFFSET: tzOffsetStr,
    TIMEZONE_OFFSET_MINUTES: tzOffsetMinutes,
    TIMEZONE_OFFSET_DST: tzOffsetStr,
    // JS Date already includes DST
    TIMEZONE_OFFSET_MINUTES_DST: tzOffsetMinutes
    // JS Date already includes DST
  };
  if (config) {
    for (const [key, value] of Object.entries(config)) {
      sources[`CONFIGURATION.${key}`] = typeof value === "boolean" ? value ? 1 : 0 : value;
    }
  }
  return { sources };
}
function isDST(date) {
  const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  const stdOffset = Math.max(jan, jul);
  return date.getTimezoneOffset() < stdOffset;
}
function localizedDataSources(time, config = {}, is24Hour = true, locale = "en-US", timeZone, calendar = "gregory") {
  const zone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" }).formatToParts(time);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const wall = new Date(Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"), time.getMilliseconds()));
  const result = buildDataSources(wall, config, is24Hour, true);
  const utc = time.getTime();
  Object.assign(result.sources, { UTC_TIMESTAMP: utc, SECONDS_SINCE_EPOCH: Math.floor(utc / 1e3), MINUTES_SINCE_EPOCH: Math.floor(utc / 6e4), HOURS_SINCE_EPOCH: Math.floor(utc / 36e5), TIMEZONE_ID: zone, LANGUAGE_LOCALE_NAME: locale.replace(/-/g, "_") });
  const formatted = (options) => new Intl.DateTimeFormat(locale, { timeZone: zone, calendar, ...options }).format(time);
  result.sources.DAY_OF_WEEK_F = formatted({ weekday: "long" });
  result.sources.DAY_OF_WEEK_S = formatted({ weekday: "short" });
  result.sources.MONTH_F = formatted({ month: "long" });
  result.sources.MONTH_S = formatted({ month: "short" });
  const field = (type, options) => new Intl.DateTimeFormat("en-US", { timeZone: zone, calendar, ...options }).formatToParts(time).find((p) => p.type === type)?.value;
  const calendarYear = Number(field("year", { year: "numeric" }));
  const calendarMonth = Number(field("month", { month: "numeric" }));
  const calendarDay = Number(field("day", { day: "numeric" }));
  if (Number.isFinite(calendarYear)) result.sources.YEAR = calendarYear;
  if (Number.isFinite(calendarMonth)) result.sources.MONTH = calendarMonth;
  if (Number.isFinite(calendarDay)) result.sources.DAY = calendarDay;
  for (const [key, length] of [["TIMEZONE", "long"], ["TIMEZONE_ABB", "short"]]) result.sources[key] = field("timeZoneName", { timeZoneName: length }) ?? "";
  const wallUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"), time.getMilliseconds());
  const offset = Math.round((wallUtc - utc) / 6e4);
  const offsetAt = (date) => {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" }).formatToParts(date).find((p2) => p2.type === "timeZoneName")?.value ?? "GMT";
    const m = p.match(/GMT([+-])(\d\d):(\d\d)/);
    return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
  };
  const standard = Math.min(offsetAt(new Date(Date.UTC(get("year"), 0, 1))), offsetAt(new Date(Date.UTC(get("year"), 6, 1))));
  const offsetText = (o) => `${o < 0 ? "-" : "+"}${Math.floor(Math.abs(o) / 60)}${o % 60 ? ":" + zeroPad(Math.abs(o) % 60) : ""}`;
  Object.assign(result.sources, { TIMEZONE_OFFSET: offsetText(standard), TIMEZONE_OFFSET_MINUTES: standard, TIMEZONE_OFFSET_DST: offsetText(offset), TIMEZONE_OFFSET_MINUTES_DST: offset, IS_DAYLIGHT_SAVING_TIME: offset !== standard ? 1 : 0 });
  const localeInfo = new Intl.Locale(locale);
  const week = localeInfo.getWeekInfo?.() ?? localeInfo.weekInfo ?? { firstDay: 7, minimalDays: 1 };
  const region = new Intl.Locale(locale).maximize().region ?? "US";
  const minimalDays = week.minimalDays ?? ("AD AN AT AX BE BG CH CZ DE DK EE ES FI FJ FO FR GB GF GG GI GP GR IE IM IS IT JE LI LT LU MC MQ NL NO PL PT RE RU SE SJ SK SM VA".split(" ").includes(region) ? 4 : 1);
  const firstDay = week.firstDay % 7;
  result.sources.FIRST_DAY_OF_WEEK = firstDay + 1;
  function weekStart(year, month) {
    const start = Date.UTC(year, month, 1), weekday = new Date(start).getUTCDay();
    const before = (weekday - firstDay + 7) % 7;
    return start - before * 864e5 + (7 - before < minimalDays ? 7 * 864e5 : 0);
  }
  const today = Date.UTC(get("year"), get("month") - 1, get("day"));
  let yearStart = weekStart(get("year"), 0);
  if (today < yearStart) yearStart = weekStart(get("year") - 1, 0);
  else if (today >= weekStart(get("year") + 1, 0)) yearStart = weekStart(get("year") + 1, 0);
  result.sources.WEEK_IN_YEAR = 1 + Math.floor((today - yearStart) / 6048e5);
  result.sources.WEEK_IN_MONTH = Math.max(0, 1 + Math.floor((today - weekStart(get("year"), get("month") - 1)) / 6048e5));
  if (calendar !== "gregory" && calendar !== "iso8601") {
    const metrics = calendarMetrics(today, calendar);
    const { year, month, day, daysInMonth } = metrics;
    const hour = Number(result.sources.HOUR_0_23);
    Object.assign(result.sources, {
      YEAR: year,
      YEAR_S: year % 100,
      MONTH: month,
      MONTH_Z: zeroPad(month),
      MONTH_0_11: month - 1,
      DAY: day,
      DAY_Z: zeroPad(day),
      DAY_0_30: day - 1,
      DAY_OF_YEAR: metrics.dayOfYear,
      DAYS_IN_MONTH: daysInMonth,
      DAY_HOUR: day + hour / 24,
      DAY_0_30_HOUR: day - 1 + hour / 24,
      MONTH_DAY: month + (day - 1) / daysInMonth,
      MONTH_0_11_DAY: month - 1 + (day - 1) / daysInMonth,
      YEAR_MONTH: year + (month - 1) / 12,
      YEAR_MONTH_DAY: year + (month - 1 + (day - 1) / daysInMonth) / 12
    });
    const startWeek = (start2) => {
      const before = (new Date(start2).getUTCDay() - firstDay + 7) % 7;
      return start2 - before * 864e5 + (7 - before < minimalDays ? 6048e5 : 0);
    };
    let start = startWeek(metrics.yearStart);
    if (today < start) start = startWeek(calendarMetrics(metrics.yearStart - 864e5, calendar).yearStart);
    else if (today >= startWeek(metrics.nextYearStart)) start = startWeek(metrics.nextYearStart);
    result.sources.WEEK_IN_YEAR = 1 + Math.floor((today - start) / 6048e5);
    result.sources.WEEK_IN_MONTH = Math.max(0, 1 + Math.floor((today - startWeek(metrics.monthStart)) / 6048e5));
  }
  return { ...result, locale, timeZone: zone, calendar };
}

// src/conditions.ts
async function renderCondition(ctx, el, renderChild, renderCtx) {
  if (renderCtx.contexts) {
    const branch = Array.from(el.children).find((c) => c.tagName === "Compare" || c.tagName === "Default");
    if (branch) for (const child of branch.children) await renderChild(ctx, child, renderCtx);
    return;
  }
  const namedResults = {};
  const expressionsEl = el.querySelector(":scope > Expressions");
  if (expressionsEl) {
    for (const exprEl of expressionsEl.children) {
      if (exprEl.tagName === "Expression") {
        const name = exprEl.getAttribute("name") ?? "";
        const expr = exprEl.getAttribute("expression") ?? exprEl.textContent?.trim() ?? "0";
        const augCtx2 = {
          ...renderCtx.expressionCtx,
          sources: { ...renderCtx.expressionCtx.sources, ...namedResults }
        };
        namedResults[name] = evaluateExpression(expr, augCtx2);
      }
    }
  }
  const augCtx = {
    ...renderCtx.expressionCtx,
    sources: { ...renderCtx.expressionCtx.sources, ...namedResults }
  };
  const augRenderCtx = { ...renderCtx, expressionCtx: augCtx };
  for (const child of el.children) {
    if (child.tagName === "Compare") {
      const expr = child.getAttribute("expression") ?? "0";
      const result = evaluateExpression(expr, augCtx);
      if (result) {
        for (const grandchild of child.children) {
          await renderChild(ctx, grandchild, augRenderCtx);
        }
        return;
      }
    }
  }
  for (const child of el.children) {
    if (child.tagName === "Default") {
      for (const grandchild of child.children) {
        await renderChild(ctx, grandchild, augRenderCtx);
      }
      return;
    }
  }
}

// src/variants.ts
function applyVariants(el, ambient) {
  for (const child of el.children) {
    if (child.tagName === "Variant") {
      const mode = child.getAttribute("mode");
      if (mode === "AMBIENT" && ambient) {
        const target = child.getAttribute("target");
        const value = child.getAttribute("value");
        if (target !== null && value !== null) {
          el.setAttribute(target, value);
        }
      }
    }
  }
}

// src/animation.ts
function ease(t, interpolation, controls) {
  t = Math.max(0, Math.min(1, t));
  switch (interpolation) {
    case "LINEAR":
      return t;
    case "EASE_IN":
      return t * t;
    case "EASE_OUT":
      return 1 - (1 - t) * (1 - t);
    case "EASE_IN_OUT":
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case "OVERSHOOT":
      return 2.70158 * t * t * t - 1.70158 * t * t;
    case "CUBIC_BEZIER": {
      if (!controls) return t;
      const parts = controls.trim().split(/[\s,]+/).map(Number);
      const [x1, y1, x2, y2] = parts;
      return cubicBezier(x1, y1, x2, y2, t);
    }
    default:
      return t;
  }
}
function cubicBezier(x1, y1, x2, y2, x) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const bx = 3 * (1 - mid) * (1 - mid) * mid * x1 + 3 * (1 - mid) * mid * mid * x2 + mid * mid * mid;
    if (bx < x) lo = mid;
    else hi = mid;
  }
  const t = (lo + hi) / 2;
  return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
}
function applyTransforms(el, expressionCtx, elapsedMs, state, key = "") {
  for (const child of el.children) {
    if (child.tagName !== "Transform") continue;
    const target = child.getAttribute("target");
    if (!target) continue;
    const valueExpr = child.getAttribute("value");
    const mode = child.getAttribute("mode") ?? "TO";
    const animEl = Array.from(child.children).find(
      (c) => c.tagName === "Animation"
    );
    if (animEl) {
      const fromAttr = child.getAttribute("from");
      const toAttr = child.getAttribute("to");
      if (fromAttr !== null && toAttr !== null) {
        const from = parseFloat(fromAttr);
        const to = parseFloat(toAttr);
        const duration = parseFloat(animEl.getAttribute("duration") ?? "1") * 1e3;
        const repeat = parseInt(animEl.getAttribute("repeat") ?? "0");
        const interpolation = animEl.getAttribute("interpolation") ?? "LINEAR";
        const controls = animEl.getAttribute("controls") ?? void 0;
        const fpsAttr = animEl.getAttribute("fps");
        const fps = fpsAttr ? parseInt(fpsAttr) : void 0;
        let elapsed = elapsedMs;
        if (repeat === -1) {
          elapsed = duration > 0 ? elapsed % duration : 0;
        } else if (repeat > 0) {
          const totalDuration = duration * (repeat + 1);
          if (elapsed > totalDuration) elapsed = totalDuration;
          if (elapsed < totalDuration) {
            elapsed = elapsed % duration;
          } else {
            elapsed = duration;
          }
        } else {
          if (elapsed > duration) elapsed = duration;
        }
        if (fps && fps > 0) {
          const frameMs = 1e3 / fps;
          elapsed = Math.floor(elapsed / frameMs) * frameMs;
        }
        let t = duration > 0 ? elapsed / duration : 1;
        t = ease(t, interpolation, controls);
        const value = from + (to - from) * t;
        applyValue(el, target, mode, value);
      } else if (valueExpr) {
        const value = evaluateExpression(valueExpr, expressionCtx);
        applyValue(el, target, mode, state ? transition(value, animEl, elapsedMs, state, `${key}.${target}`) : value);
      }
    } else if (valueExpr) {
      const value = evaluateExpression(valueExpr, expressionCtx);
      applyValue(el, target, mode, value);
    }
  }
}
function applyValue(el, target, mode, value) {
  if (mode === "TO") {
    el.setAttribute(target, String(value));
  } else if (mode === "BY") {
    const base = parseFloat(el.getAttribute(target) ?? "0");
    el.setAttribute(target, String(base + Number(value)));
  }
}
function transition(value, animation, now, states, key, timing) {
  let state = states.get(key);
  if (!state) {
    states.set(key, { from: value, to: value, start: now, current: value });
    return value;
  }
  if (value !== state.to) {
    state = { from: state.current, to: value, start: now, current: state.current };
    states.set(key, state);
  }
  const duration = timing?.durationMs ?? Number(animation.getAttribute("duration") ?? 1) * 1e3;
  const repeat = Number(animation.getAttribute("repeat") ?? 0);
  if (now < state.start + (timing?.delayMs ?? 0)) return state.current;
  let elapsed = Math.max(0, now - state.start - (timing?.delayMs ?? 0));
  if (duration > 0 && (repeat === -1 || elapsed < duration * (repeat + 1))) elapsed %= duration;
  const fps = Number(animation.getAttribute("fps") ?? 15);
  if (fps > 0 && elapsed < duration) elapsed = Math.floor(elapsed * fps / 1e3) * 1e3 / fps;
  const t = ease(duration > 0 ? elapsed / duration : 1, animation.getAttribute("interpolation") ?? "LINEAR", animation.getAttribute("controls") ?? "0.5 0.5 0.5 0.5");
  if (typeof state.from === "string" && state.from.startsWith("#") && String(value).startsWith("#")) {
    state.current = mixColor(state.from, String(value), t);
  } else if (Number.isFinite(Number(state.from)) && Number.isFinite(Number(value))) {
    let delta = Number(value) - Number(state.from);
    const direction = animation.getAttribute("angleDirection");
    if (direction === "CLOCKWISE") delta = (delta % 360 + 360) % 360;
    if (direction === "COUNTER_CLOCKWISE") delta = -((-delta % 360 + 360) % 360);
    state.current = t >= 1 ? value : Number(state.from) + delta * t;
  } else state.current = value;
  return state.current;
}

// src/attributes.ts
function number(el, name, fallback = 0) {
  const value = Number(el.getAttribute(name) ?? fallback);
  return Number.isFinite(value) ? value : fallback;
}
function boolean(value) {
  return value?.toUpperCase() === "TRUE" || value === "1";
}
function resolveValue(value, ctx) {
  if (/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)) return value;
  if (value.includes("[") || /\w+\(/.test(value)) {
    try {
      return evaluateExpression(value, ctx);
    } catch {
      return value.replace(/\[([^\]]+)\]/g, (_, name) => String(ctx.sources[name] ?? ""));
    }
  }
  return ctx.strings?.[value.replace(/^@string\//, "")] ?? value;
}
function applyAttributes(el, ctx, ambient, elapsed, states, key, ambientTransitionDurationMs = 1e3) {
  applyTransforms(el, ctx, elapsed, states, key);
  for (const variant of Array.from(el.children).filter((c) => c.tagName === "Variant")) {
    if (variant.getAttribute("mode") !== "AMBIENT") continue;
    const target = variant.getAttribute("target");
    if (!target) continue;
    const animation = variant.querySelector(":scope > Animation");
    const fallback = target === "alpha" ? "255" : target === "scaleX" || target === "scaleY" ? "1" : "0";
    const value = ambient ? resolveValue(variant.getAttribute("value") ?? "0", ctx) : resolveValue(el.getAttribute(target) ?? fallback, ctx);
    const duration = Math.max(0, Math.min(1, number(variant, "duration", 1)));
    let offset = Math.max(0, Math.min(1, number(variant, "startOffset")));
    if (duration + offset > 1) offset = 0;
    el.setAttribute(target, String(transition(
      value,
      animation ?? variant,
      elapsed,
      states,
      `${key}.variant.${target}`,
      animation ? void 0 : { durationMs: duration * ambientTransitionDurationMs, delayMs: offset * ambientTransitionDurationMs }
    )));
  }
  for (const attr of Array.from(el.attributes)) {
    if (["expression", "value", "source", "format", "stringId"].includes(attr.name)) continue;
    if (attr.value.includes("[")) el.setAttribute(attr.name, String(resolveValue(attr.value, ctx)));
  }
  const gyro = el.querySelector(":scope > Gyro");
  if (gyro && !ambient) for (const attr of Array.from(gyro.attributes)) {
    const value = Number(evaluateExpression(attr.value, ctx));
    if (attr.name === "x" || attr.name === "y" || attr.name === "angle") el.setAttribute(attr.name, String(number(el, attr.name) + value));
    else if (attr.name === "scaleX" || attr.name === "scaleY") el.setAttribute(attr.name, String(number(el, attr.name, 1) * value));
    else if (attr.name === "alpha") el.setAttribute("alpha", String(number(el, "alpha", 255) * value / 255));
  }
}
function applyGeometry(ctx, el) {
  const w = number(el, "width"), h = number(el, "height");
  const px = number(el, "pivotX", 0.5) * w, py = number(el, "pivotY", 0.5) * h;
  ctx.translate(number(el, "x"), number(el, "y"));
  ctx.translate(px, py);
  ctx.rotate(number(el, "angle") * Math.PI / 180);
  ctx.scale(number(el, "scaleX", 1), number(el, "scaleY", 1));
  ctx.translate(-px, -py);
  ctx.globalAlpha *= Math.max(0, Math.min(255, number(el, "alpha", 255))) / 255;
}

// src/images.ts
var imageCache = /* @__PURE__ */ new WeakMap();
var animationCache = /* @__PURE__ */ new WeakMap();
function assetBuffer(resource, assets) {
  const key = resource.replace(/^@drawable\//, "");
  return assets.get(key) ?? ["png", "webp", "jpg", "jpeg", "gif"].map((ext) => assets.get(`${key}.${ext}`) ?? assets.get(`res/drawable/${key}.${ext}`)).find(Boolean);
}
async function getOrDecodeImage(resource, assets) {
  const buffer = assetBuffer(resource, assets);
  if (!buffer) return null;
  let decoded = imageCache.get(buffer);
  if (!decoded) {
    decoded = createImageBitmap(new Blob([buffer]));
    imageCache.set(buffer, decoded);
  }
  return decoded;
}
function drawImage(ctx, image, x, y, w, h, tint) {
  if (w <= 0 || h <= 0) return;
  if (!tint) {
    ctx.drawImage(image, x, y, w, h);
    return;
  }
  const layer = new OffscreenCanvas(Math.ceil(w), Math.ceil(h)), target = layer.getContext("2d");
  target.drawImage(image, 0, 0, w, h);
  target.globalCompositeOperation = "source-in";
  target.fillStyle = parseColor(tint);
  target.fillRect(0, 0, w, h);
  ctx.drawImage(layer, x, y, w, h);
}
function triggers(el, renderCtx, state) {
  const timestamp = Number(renderCtx.expressionCtx.sources.UTC_TIMESTAMP);
  const owner = el.closest("PartImage, PartAnimatedImage");
  const key = owner?.getAttribute("data-wff-key") ?? "";
  return {
    TAP: renderCtx.events?.get(`TAP:${key}`) ?? 0,
    ON_VISIBLE: (renderCtx.events?.get("ON_VISIBLE") ?? 0) + (state?.appearances ?? 0),
    ON_NEXT_SECOND: Math.floor(timestamp / 1e3),
    ON_NEXT_MINUTE: Math.floor(timestamp / 6e4),
    ON_NEXT_HOUR: Math.floor(timestamp / 36e5)
  };
}
function stateFor(el, renderCtx) {
  const key = el.getAttribute("data-wff-key") ?? el.tagName;
  const states = renderCtx.imageStates ?? (renderCtx.imageStates = /* @__PURE__ */ new Map());
  let state = states.get(key);
  if (!state) {
    state = { index: 0, triggers: triggers(el, renderCtx) };
    states.set(key, state);
  }
  const globalVisibility = renderCtx.events?.get("ON_VISIBLE") ?? 0;
  if (state.hiddenAt !== void 0) {
    if (state.lastVisibleEvent === globalVisibility) state.appearances = (state.appearances ?? 0) + 1;
    if (state.resume && state.playStart !== void 0) state.playStart += renderCtx.elapsedMs - state.hiddenAt;
    else state.playStart = void 0;
    state.hiddenAt = void 0;
  }
  state.lastVisibleEvent = globalVisibility;
  state.lastSeen = renderCtx.frameId;
  return state;
}
function changed(state, el, names, renderCtx) {
  const current = triggers(el, renderCtx, state);
  let changes = 0;
  for (const name of names.trim().split(/\s+/)) {
    const previous = state.triggers[name] ?? current[name];
    if (current[name] !== previous) changes += Math.max(1, current[name] - previous);
  }
  state.triggers = current;
  return changes;
}
function select(el, entries, renderCtx) {
  if (!entries.length) return;
  const state = stateFor(el, renderCtx);
  const changes = changed(state, el, el.getAttribute("change") ?? "TAP", renderCtx);
  if (changes) {
    const direction = el.getAttribute("changeDirection") ?? "FORWARD";
    state.index = direction === "RANDOM" ? Math.floor((renderCtx.random ?? Math.random)() * entries.length) : ((state.index + changes * (direction === "BACKWARD" ? -1 : 1)) % entries.length + entries.length) % entries.length;
  }
  return entries[state.index % entries.length];
}
function filterPixels(data, hue, saturation, brightness) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
    let h = delta === 0 ? 0 : max === r ? (g - b) / delta % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    h = ((h * 60 + hue) % 360 + 360) % 360;
    const s = (max ? delta / max : 0) * Math.max(0, Math.min(1, saturation));
    const v = max * Math.max(0, Math.min(1, brightness)), c = v * s, x = c * (1 - Math.abs(h / 60 % 2 - 1)), m = v - c;
    const channels = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    for (let j = 0; j < 3; j++) data[i + j] = (channels[j] + m) * 255;
  }
}
async function animatedFrames(el, renderCtx) {
  const resource = el.getAttribute("resource") ?? "", buffer = assetBuffer(resource, renderCtx.assets);
  if (!buffer) return [];
  const format = el.getAttribute("format") ?? "IMAGE";
  if (format === "IMAGE") {
    const bitmap = await getOrDecodeImage(resource, renderCtx.assets);
    return bitmap ? [{ image: bitmap, durationMs: 1e3 }] : [];
  }
  let promise = animationCache.get(buffer);
  if (!promise) {
    promise = (async () => {
      const Decoder = globalThis.ImageDecoder;
      if (!Decoder) {
        const timing = assetBuffer(`${resource}-timing`, renderCtx.assets);
        const atlas = await getOrDecodeImage(`${resource}-frames`, renderCtx.assets);
        if (!timing || !atlas) throw new Error("AnimatedImage requires ImageDecoder or a frame atlas");
        const { columns, width, height, durations } = JSON.parse(new TextDecoder().decode(timing));
        return Promise.all(durations.map(async (durationMs, i) => ({
          image: await createImageBitmap(atlas, (i % columns) * width, Math.floor(i / columns) * height, width, height),
          durationMs,
        })));
      }
      const decoder = new Decoder({ data: buffer, type: format === "AGIF" ? "image/gif" : "image/webp" });
      try {
        await decoder.tracks.ready;
        await decoder.completed;
        const frames = [];
        for (let i = 0; i < (decoder.tracks.selectedTrack?.frameCount ?? 0); i++) {
          const { image } = await decoder.decode({ frameIndex: i });
          const durationMs = Math.max(1, (image.duration ?? 1e5) / 1e3);
          const bitmap = await createImageBitmap(image);
          image.close();
          frames.push({ image: bitmap, durationMs });
        }
        return frames;
      } finally {
        decoder.close();
      }
    })();
    animationCache.set(buffer, promise);
  }
  return promise;
}
async function animationImage(el, owner, renderCtx) {
  const controller = owner.querySelector(":scope > AnimationController");
  const state = stateFor(controller ?? el, renderCtx);
  const now = renderCtx.elapsedMs;
  const play = controller?.getAttribute("play") ?? "ON_VISIBLE";
  const changes = changed(state, controller ?? el, play, renderCtx);
  if (state.playStart === void 0 && play.includes("ON_VISIBLE")) state.playStart = now;
  state.resume = controller ? boolean(controller.getAttribute("resumePlayBack")) : false;
  const resourceKey = el.getAttribute("data-wff-key") ?? el.getAttribute("resource") ?? "";
  if (state.resourceKey !== void 0 && state.resourceKey !== resourceKey) state.playStart = now;
  state.resourceKey = resourceKey;
  if (changes && !(state.resume && play.trim() === "ON_VISIBLE" && state.playStart !== void 0)) state.playStart = now;
  const sequence = el.tagName === "SequenceImages" || el.tagName === "SequenceImage";
  let frames;
  if (sequence) {
    const fps = number(el, "frameRate", 15);
    frames = [];
    for (const child of el.children) if (child.tagName === "Image") {
      const bitmap = await getOrDecodeImage(child.getAttribute("resource") ?? "", renderCtx.assets);
      if (bitmap) frames.push({ image: bitmap, durationMs: 1e3 / Math.max(1, fps) });
    }
  } else frames = await animatedFrames(el, renderCtx);
  if (!frames.length) return null;
  const delay = controller ? number(controller, "delayPlay") * 1e3 : 0;
  let position = now - (state.playStart ?? now) - delay;
  const duration = frames.reduce((a, f) => a + f.durationMs, 0);
  const repeatDelay = controller ? number(controller, "delayRepeat") * 1e3 : 0;
  const loops = controller && boolean(controller.getAttribute("repeat")) ? Infinity : controller ? number(controller, "loopCount", 1) : number(el, "loopCount", 1);
  let mode = null;
  let completed = false;
  if (renderCtx.ambient || state.playStart === void 0 || position < 0) mode = controller?.getAttribute("beforePlaying") ?? "DO_NOTHING";
  else if (position >= duration * loops + repeatDelay * Math.max(0, loops - 1)) {
    completed = true;
    mode = controller?.getAttribute("afterPlaying") ?? "DO_NOTHING";
  }
  if (mode === "HIDE") return null;
  if (mode === "THUMBNAIL") return getOrDecodeImage(el.getAttribute("thumbnail") ?? "", renderCtx.assets);
  if (mode === "FIRST_FRAME") {
    state.heldFrame = 0;
    return frames[0].image;
  }
  if (mode === "DO_NOTHING") {
    if (completed) state.heldFrame = frames.length - 1;
    return frames[state.heldFrame ?? 0].image;
  }
  position %= duration + repeatDelay;
  for (let i = 0; i < frames.length; i++) {
    if (position < frames[i].durationMs) {
      state.heldFrame = i;
      return frames[i].image;
    }
    position -= frames[i].durationMs;
  }
  state.heldFrame = frames.length - 1;
  return frames.at(-1).image;
}
async function renderPartImage(ctx, el, renderCtx, assets) {
  let child = Array.from(el.children).find((c) => ["Image", "Images", "Photos", "AnimatedImage", "AnimatedImages", "SequenceImages", "SequenceImage"].includes(c.tagName));
  if (!child) return;
  if (child.tagName === "Images" || child.tagName === "AnimatedImages") child = select(child, Array.from(child.children).filter((c) => ["Image", "AnimatedImage", "SequenceImages", "SequenceImage"].includes(c.tagName)), renderCtx);
  if (!child) return;
  let bitmap;
  if (child.tagName === "Photos") {
    const source = child.getAttribute("source") ?? "", id = source.replace(/^\[CONFIGURATION\.(.*)\]$/, "$1");
    const photos = renderCtx.photos?.[id] ?? [];
    const state = stateFor(child, renderCtx), previous = { ...state.triggers };
    const names = (child.getAttribute("change") ?? "TAP").split(/\s+/);
    changed(state, child, names.join(" "), renderCtx);
    const every = Math.max(3, Math.min(10, number(child, "changeAfterEvery", 3)));
    for (const name of names) {
      const before = previous[name] ?? state.triggers[name] ?? 0, after = state.triggers[name] ?? 0;
      state.index += name === "ON_VISIBLE" ? Math.floor(after / every) - Math.floor(before / every) : Math.max(0, after - before);
    }
    bitmap = await getOrDecodeImage(photos[state.index % Math.max(1, photos.length)] ?? child.getAttribute("defaultImageResource") ?? "", assets);
  } else if (child.tagName === "Image") bitmap = await getOrDecodeImage(child.getAttribute("resource") ?? "", assets);
  else bitmap = await animationImage(child, el, renderCtx);
  if (!bitmap) return;
  const w = number(el, "width"), h = number(el, "height");
  if (w <= 0 || h <= 0) return;
  const layer = new OffscreenCanvas(Math.ceil(w), Math.ceil(h)), target = layer.getContext("2d");
  if (child.tagName === "Photos") {
    const size = bitmap;
    const cropWidth = Math.min(size.width, number(child, "width", size.width)), cropHeight = Math.min(size.height, number(child, "height", size.height));
    const ratio = Math.max(w / cropWidth, h / cropHeight);
    const cw = w / ratio, ch = h / ratio;
    target.drawImage(bitmap, (size.width - cw) / 2, (size.height - ch) / 2, cw, ch, 0, 0, w, h);
  } else drawImage(target, bitmap, 0, 0, w, h, null);
  for (const filter of el.querySelectorAll(":scope > ImageFilters > HsbFilter")) {
    const data = target.getImageData(0, 0, layer.width, layer.height);
    filterPixels(data.data, number(filter, "hueRotate"), number(filter, "saturate", 1), number(filter, "brightness", 1));
    target.putImageData(data, 0, 0);
  }
  drawImage(ctx, layer, 0, 0, w, h, null);
}

// src/text.ts
var WEIGHTS = { THIN: 100, ULTRA_LIGHT: 200, EXTRA_LIGHT: 200, LIGHT: 300, NORMAL: 400, MEDIUM: 500, SEMI_BOLD: 600, BOLD: 700, ULTRA_BOLD: 800, EXTRA_BOLD: 800, BLACK: 900, EXTRA_BLACK: 1e3 };
var STRETCH = { ULTRA_CONDENSED: "ultra-condensed", EXTRA_CONDENSED: "extra-condensed", CONDENSED: "condensed", SEMI_CONDENSED: "semi-condensed", NORMAL: "normal", SEMI_EXPANDED: "semi-expanded", EXPANDED: "expanded", EXTRA_EXPANDED: "extra-expanded", ULTRA_EXPANDED: "ultra-expanded" };
var loadedFonts = /* @__PURE__ */ new WeakMap();
async function loadFonts(doc, assets) {
  if (typeof FontFace === "undefined") return;
  const find = (name) => assets.get(name) ?? ["ttf", "otf", "ttc", "xml"].map((ext) => assets.get(`${name}.${ext}`) ?? assets.get(`font/${name}.${ext}`) ?? assets.get(`res/font/${name}.${ext}`)).find(Boolean);
  async function load(family, resource, weight, style, stretch, visiting) {
    if (visiting.has(resource)) throw new Error(`Cyclic font family: ${resource}`);
    const buffer = find(resource);
    if (!buffer) return;
    if (new TextDecoder().decode(buffer.slice(0, 100)).trimStart().startsWith("<")) {
      const parsed = new DOMParser().parseFromString(new TextDecoder().decode(buffer), "text/xml");
      for (const font of parsed.querySelectorAll("font")) {
        const reference = font.getAttribute("font") ?? font.getAttribute("android:font");
        if (reference) await load(
          family,
          reference.replace(/^@font\//, ""),
          font.getAttribute("fontWeight") ?? font.getAttribute("android:fontWeight") ?? weight,
          font.getAttribute("fontStyle") ?? font.getAttribute("android:fontStyle") ?? style,
          stretch,
          /* @__PURE__ */ new Set([...visiting, resource])
        );
      }
      return;
    }
    let cache = loadedFonts.get(buffer);
    if (!cache) {
      cache = /* @__PURE__ */ new Map();
      loadedFonts.set(buffer, cache);
    }
    const key = `${family}:${weight}:${style}:${stretch}`;
    let promise = cache.get(key);
    if (!promise) {
      promise = new FontFace(family, buffer, { weight, style, stretch }).load().then((face) => {
        document.fonts.add(face);
      });
      cache.set(key, promise);
    }
    try {
      await promise;
    } catch {
      cache.delete(key);
    }
  }
  for (const font of doc.querySelectorAll("Font[family]")) {
    const family = font.getAttribute("family");
    await load(family, family, String(WEIGHTS[font.getAttribute("weight") ?? "NORMAL"] ?? 400), font.getAttribute("slant") === "ITALIC" ? "italic" : "normal", STRETCH[font.getAttribute("width") ?? "NORMAL"], /* @__PURE__ */ new Set());
  }
}
function parseFont(el, parent) {
  const family = el?.getAttribute("family") ?? parent?.family ?? "sans-serif";
  return {
    ...parent,
    family: family === "SYNC_TO_DEVICE" ? "sans-serif" : family,
    stretch: STRETCH[el?.getAttribute("width") ?? ""] ?? parent?.stretch ?? "normal",
    size: el ? number(el, "size", parent?.size ?? 16) : 16,
    minSize: Math.max(0, el ? number(el, "minSize", parent?.minSize ?? 12) : 12),
    color: el?.getAttribute("color") ?? parent?.color ?? "#FFFFFF",
    weight: WEIGHTS[el?.getAttribute("weight") ?? ""] ?? parent?.weight ?? 400,
    style: el?.getAttribute("slant") === "ITALIC" ? "italic" : parent?.style ?? "normal",
    letterSpacing: el ? number(el, "letterSpacing", parent?.letterSpacing ?? 0) : 0,
    underline: parent?.underline || Boolean(el?.querySelector(":scope > Underline")),
    strikeThrough: parent?.strikeThrough || Boolean(el?.querySelector(":scope > StrikeThrough"))
  };
}
function applyFont(ctx, spec, scale) {
  ctx.font = `${spec.style} ${spec.weight} ${spec.size * scale}px "${spec.family}"`;
  ctx.fontStretch = spec.stretch;
  ctx.fillStyle = parseColor(spec.color);
  ctx.letterSpacing = `${spec.letterSpacing * spec.size * scale}px`;
}
function expression(el, ctx) {
  return resolveValue(el.getAttribute("expression") ?? "", ctx);
}
function template(el, ctx) {
  const raw = Array.from(el.childNodes).filter((n) => n.nodeType === 3 || n.nodeType === 4).map((n) => n.textContent).join("").trim();
  return formatTemplate(String(resolveValue(raw || el.getAttribute("stringId") || "", ctx)), Array.from(el.children).filter((c) => c.tagName === "Parameter").map((c) => expression(c, ctx)), ctx);
}
function collectRuns(el, renderCtx, inherited = parseFont(null), transform = (s) => s) {
  const ctx = renderCtx.contexts?.get(el) ?? renderCtx.expressionCtx;
  let spec = inherited;
  if (el.tagName === "Font" || el.tagName === "BitmapFont") {
    spec = parseFont(el, inherited);
    if (el.tagName === "BitmapFont") {
      spec.bitmapTint = el.getAttribute("color") ?? void 0;
      spec.bitmap = Array.from(el.ownerDocument.querySelectorAll("BitmapFonts > BitmapFont")).find((f) => f.getAttribute("name") === spec.family);
    }
  } else if (el.tagName === "Underline") spec = { ...spec, underline: true };
  else if (el.tagName === "StrikeThrough") spec = { ...spec, strikeThrough: true };
  else if (el.tagName === "Outline") spec = { ...spec, outline: el };
  else if (el.tagName === "Shadow") spec = { ...spec, shadow: el };
  else if (el.tagName === "OutGlow" || el.tagName === "Glow") spec = { ...spec, glow: el };
  if (el.tagName === "Upper" || el.tagName === "Lower") {
    const previous = transform;
    transform = (s) => previous(el.tagName === "Upper" ? s.toLocaleUpperCase(ctx.locale) : s.toLocaleLowerCase(ctx.locale));
  }
  if (el.tagName === "Template") return [{ text: transform(template(el, ctx)), spec }];
  if (el.tagName === "InlineImage") return [{ image: el, spec }];
  const runs = [];
  for (const node of el.childNodes) {
    if (node.nodeType === 3 || node.nodeType === 4) {
      const raw = node.textContent ?? "";
      if (/^\s*[\r\n]\s*$/.test(raw)) continue;
      const text = raw.replace(/^[ \t]*\n[ \t]+|[ \t]+\n[ \t]*$/g, "").replace(/\[([^\]]+)\]/g, (_, name) => String(ctx.sources[name] ?? ""));
      if (text) runs.push({ text: transform(text), spec });
    } else if (node.nodeType === 1 && !["Transform", "Variant", "Reference", "Parameter", "Localization"].includes(node.tagName)) {
      runs.push(...collectRuns(node, renderCtx, spec, transform));
    }
  }
  if (["Text", "TextCircular"].includes(el.tagName)) {
    const font = el.querySelector(":scope > Font");
    if (font && !font.textContent?.trim()) {
      for (const run of runs) if (run.spec === inherited) run.spec = parseFont(font);
    }
  }
  return runs;
}
function glyphs(ctx, runs, scale) {
  const result = [];
  for (const run of runs) {
    applyFont(ctx, run.spec, scale);
    if (run.image) {
      const width = number(run.image, "width") - number(run.image, "overlapLeft") - number(run.image, "overlapRight");
      const height = number(run.image, "height") * scale;
      result.push({ run, image: run.image, text: "", width: width * scale, height, ascent: height, descent: 0 });
      continue;
    }
    const mappings = Array.from(run.spec.bitmap?.children ?? []).sort((a, b) => (b.getAttribute("name")?.length ?? 0) - (a.getAttribute("name")?.length ?? 0));
    let text = run.text ?? "", prefix = "";
    while (text.length) {
      const mapping = mappings.find((m) => text.startsWith(m.getAttribute("name") ?? "\0"));
      const char = mapping?.getAttribute("name") ?? Array.from(new Intl.Segmenter().segment(text))[0].segment;
      const size = run.spec.size * scale;
      if (mapping) result.push({ run, image: mapping, text: char, width: number(mapping, "width") * size / number(mapping, "height", 1), height: size, ascent: size, descent: 0 });
      else {
        const width = char === "\n" ? 0 : ctx.measureText(prefix + char).width - ctx.measureText(prefix).width;
        ctx.textBaseline = "alphabetic";
        const metrics = ctx.measureText(char);
        result.push({ run, text: char, width, height: size * 1.2, ascent: Math.max(0, metrics.actualBoundingBoxAscent), descent: Math.max(0, metrics.actualBoundingBoxDescent) });
      }
      prefix = char === "\n" ? "" : prefix + char;
      text = text.slice(char.length);
    }
  }
  return result;
}
function layout(units, width) {
  const lines = [[]];
  let lineWidth = 0;
  for (const glyph of units) {
    if (glyph.text === "\n") {
      lines.push([]);
      lineWidth = 0;
      continue;
    }
    let line = lines.at(-1);
    if (line.length && lineWidth + glyph.width > width) {
      const space = line.map((u) => u.text).lastIndexOf(" ");
      if (space > 0) {
        const tail = line.splice(space);
        tail.shift();
        lines.push(tail);
        lineWidth = tail.reduce((a, g) => a + g.width, 0);
      } else {
        lines.push([]);
        lineWidth = 0;
      }
      line = lines.at(-1);
      if (glyph.text === " " && !line.length) continue;
    }
    line.push(glyph);
    lineWidth += glyph.width;
  }
  return lines;
}
async function drawGlyph(ctx, glyph, x, y, scale, renderCtx, baseline = false) {
  const spec = glyph.run.spec;
  ctx.save();
  try {
    applyFont(ctx, spec, scale);
    ctx.textAlign = "left";
    ctx.textBaseline = baseline ? "alphabetic" : "middle";
    if (glyph.image) {
      const image = glyph.image;
      const source = image.getAttribute("source");
      const resource = source ? String(resolveValue(source, renderCtx.expressionCtx)) : image.getAttribute("resource") ?? "";
      const bitmap = await getOrDecodeImage(resource, renderCtx.assets);
      const width = image.tagName === "InlineImage" ? number(image, "width") * scale : glyph.width;
      if (bitmap) drawImage(ctx, bitmap, x - number(image, "overlapLeft") * scale, y - (baseline ? glyph.ascent : glyph.height / 2), width, glyph.height, image.getAttribute("color") ?? (spec.bitmap ? spec.bitmapTint ?? null : null));
    } else {
      const shadow = spec.shadow ?? spec.glow;
      if (shadow) {
        ctx.shadowColor = parseColor(shadow.getAttribute("color"));
        ctx.shadowBlur = number(shadow, "radius", spec.glow ? 8 : 2) * scale;
        ctx.shadowOffsetX = spec.shadow ? number(shadow, "offsetX", 2) * scale : 0;
        ctx.shadowOffsetY = spec.shadow ? number(shadow, "offsetY", 2) * scale : 0;
      }
      if (spec.outline) {
        ctx.strokeStyle = parseColor(spec.outline.getAttribute("color"));
        ctx.lineWidth = 2 * number(spec.outline, "width", 2) * scale;
        ctx.strokeText(glyph.text, x, y);
      }
      ctx.fillText(glyph.text, x, y);
      if (spec.underline || spec.strikeThrough) {
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = parseColor(spec.color);
        ctx.lineWidth = Math.max(1, spec.size * scale / 14);
        for (const offset of [spec.underline ? spec.size * 0.42 : void 0, spec.strikeThrough ? 0 : void 0]) if (offset !== void 0) {
          const decorationY = y + (offset - (baseline ? spec.size * 0.35 : 0)) * scale;
          ctx.beginPath();
          ctx.moveTo(x, decorationY);
          ctx.lineTo(x + glyph.width, decorationY);
          ctx.stroke();
        }
      }
    }
  } finally {
    ctx.restore();
  }
}
function merged(line) {
  const result = [];
  for (const glyph of line) {
    const last = result.at(-1);
    if (last && !last.image && !glyph.image && last.run === glyph.run) {
      last.text += glyph.text;
      last.width += glyph.width;
      last.ascent = Math.max(last.ascent, glyph.ascent);
      last.descent = Math.max(last.descent, glyph.descent);
    } else result.push({ ...glyph });
  }
  return result;
}
async function renderPartText(ctx, el, renderCtx) {
  const text = el.querySelector(":scope > Text, :scope > TextCircular");
  if (!text) return;
  const runs = collectRuns(text, renderCtx);
  await renderRuns(ctx, text, runs, number(el, "width"), number(el, "height"), renderCtx);
}
async function renderRuns(ctx, el, runs, width, height, renderCtx) {
  if (!runs.length) return;
  const circular = el.tagName === "TextCircular";
  const cw = el.getAttribute("direction") !== "COUNTER_CLOCKWISE", sign = cw ? 1 : -1;
  const rx = number(el, "width", width) / 2, ry = number(el, "height", height) / 2;
  const start = number(el, "startAngle"), raw = (number(el, "endAngle", 360) - start) * sign;
  const sweep = Math.abs(raw) >= 360 ? 360 : (raw % 360 + 360) % 360;
  const count = Math.max(1, Math.ceil(sweep * 4));
  const samples = [0];
  let previous = { x: rx * Math.sin(start * Math.PI / 180), y: -ry * Math.cos(start * Math.PI / 180) };
  if (circular) for (let i = 1; i <= count; i++) {
    const angle = (start + sign * sweep * i / count) * Math.PI / 180;
    const point = { x: rx * Math.sin(angle), y: -ry * Math.cos(angle) };
    samples.push(samples.at(-1) + Math.hypot(point.x - previous.x, point.y - previous.y));
    previous = point;
  }
  const available = circular ? samples.at(-1) : width;
  const verticalAlign = el.getAttribute("verticalAlign");
  const baseline = verticalAlign !== null;
  const spacing = circular ? 0 : Math.max(-5, number(el, "lineSpacing"));
  let scale = 1, units = glyphs(ctx, runs, scale);
  const maxLines = number(el, "maxLines", 1);
  const lineMetrics = (line) => {
    const ascent = Math.max(0, ...line.map((g) => g.ascent)), descent = Math.max(0, ...line.map((g) => g.descent));
    const height2 = baseline && ascent + descent > 0 ? ascent + descent : Math.max(runs[0].spec.size * scale * 1.2, ...line.map((g) => g.height));
    return { ascent, descent, height: height2 };
  };
  const blockHeight = (lines2) => lines2.reduce((sum, line) => sum + lineMetrics(line).height, 0) + Math.max(0, lines2.length - 1) * spacing;
  const fit = () => {
    const lines2 = circular ? [units] : maxLines === 1 ? layout(units, Infinity) : layout(units, available);
    return { lines: lines2, height: blockHeight(lines2) };
  };
  let result = fit();
  if (boolean(el.getAttribute("isAutoSize"))) {
    const minimum = Math.min(1, Math.max(0, ...runs.filter((r) => !r.image && r.spec.size > 0).map((r) => r.spec.minSize / r.spec.size)));
    while (scale > minimum && (result.lines.some((l) => l.reduce((a, g) => a + g.width, 0) > available) || !circular && (result.height > height || maxLines > 0 && result.lines.length > maxLines))) {
      scale = Math.max(minimum, scale - 0.02);
      units = glyphs(ctx, runs, scale);
      result = fit();
    }
  }
  let lines = result.lines;
  let visibleLines = maxLines > 0 ? maxLines : result.lines.length;
  if (maxLines <= 0) while (visibleLines > 1 && blockHeight(result.lines.slice(0, visibleLines)) > height) visibleLines--;
  const truncated = lines.length > visibleLines;
  if (!circular) lines = lines.slice(0, visibleLines);
  if (boolean(el.getAttribute("ellipsis"))) {
    const last = lines.at(-1);
    const overflow = truncated || last.reduce((a, g) => a + g.width, 0) > available;
    if (overflow) {
      const run = last.at(-1)?.run ?? runs[0];
      const ellipsis = glyphs(ctx, [{ ...run, text: "\u2026" }], scale)[0];
      while (last.length && last.reduce((a, g) => a + g.width, 0) + ellipsis.width > available) last.pop();
      if (ellipsis.width <= available) last.push(ellipsis);
    }
  }
  const align = el.getAttribute("align") ?? (el.tagName === "TimeText" ? "START" : "CENTER");
  const rtl = /^(ar|he|fa|ur)(-|$)/.test(renderCtx.expressionCtx.locale ?? "");
  const factor = align === "CENTER" ? 0.5 : align === "END" !== rtl ? 1 : 0;
  ctx.save();
  try {
    ctx.direction = rtl ? "rtl" : "ltr";
    if (circular) {
      const line = lines[0], length = line.reduce((a, g) => a + g.width, 0);
      const metrics = lineMetrics(line);
      const offset = verticalAlign === "TOP" ? metrics.ascent : verticalAlign === "BOTTOM" ? -metrics.descent : verticalAlign === "CENTER" ? (metrics.ascent - metrics.descent) / 2 : 0;
      let distance = Math.max(0, samples.at(-1) - length) * factor;
      for (const glyph of line) {
        const center = distance + glyph.width / 2;
        let i = samples.findIndex((s) => s >= center);
        if (i < 1) i = samples.length - 1;
        const fraction = (center - samples[i - 1]) / (samples[i] - samples[i - 1] || 1);
        const angle = (start + sign * sweep * (i - 1 + fraction) / count) * Math.PI / 180;
        ctx.save();
        ctx.translate(number(el, "centerX", width / 2) + rx * Math.sin(angle), number(el, "centerY", height / 2) - ry * Math.cos(angle));
        ctx.rotate(Math.atan2(sign * ry * Math.sin(angle), sign * rx * Math.cos(angle)));
        await drawGlyph(ctx, glyph, -glyph.width / 2, offset, scale, renderCtx, baseline);
        ctx.restore();
        distance += glyph.width;
      }
    } else {
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.clip();
      const metrics = lines.map(lineMetrics), total = blockHeight(lines);
      let y = verticalAlign === "TOP" ? 0 : verticalAlign === "BOTTOM" ? height - total : verticalAlign === "CENTER_ON_BASELINE" ? height / 2 - metrics[0].ascent : (height - total) / 2;
      for (let i = 0; i < lines.length; i++) {
        const line = merged(lines[i]);
        let x = (width - line.reduce((a, g) => a + g.width, 0)) * factor;
        const lineY = y + (baseline ? metrics[i].ascent : metrics[i].height / 2);
        for (const glyph of line) {
          await drawGlyph(ctx, glyph, x, lineY, scale, renderCtx, baseline);
          x += glyph.width;
        }
        y += metrics[i].height + spacing;
      }
    }
  } finally {
    ctx.restore();
  }
}
async function renderDigitalClock(ctx, el, renderCtx) {
  for (const child of el.children) {
    if (child.tagName !== "TimeText" || number(child, "alpha", 255) <= 0) continue;
    const local = renderCtx.contexts?.get(child) ?? renderCtx.expressionCtx;
    const text = formatTime(child.getAttribute("format") ?? "HH:mm", Number(local.sources.UTC_TIMESTAMP ?? Date.now()), local, child.getAttribute("hourFormat") ?? "SYNC_TO_DEVICE");
    const font = child.querySelector(":scope > Font, :scope > BitmapFont");
    const runs = collectRuns(font ?? child, { ...renderCtx, expressionCtx: local });
    const spec = runs[0]?.spec ?? parseFont(font);
    if (font?.tagName === "BitmapFont") {
      spec.bitmapTint = font.getAttribute("color") ?? void 0;
      spec.bitmap = Array.from(child.ownerDocument.querySelectorAll("BitmapFonts > BitmapFont")).find((f) => f.getAttribute("name") === spec.family);
    }
    if (child.hasAttribute("size")) spec.size = number(child, "size", spec.size);
    ctx.save();
    try {
      applyGeometry(ctx, child);
      await renderRuns(ctx, child, [{ text, spec }], number(child, "width", number(el, "width")) || number(el, "width"), number(child, "height", number(el, "height")) || number(el, "height"), { ...renderCtx, expressionCtx: local });
    } finally {
      ctx.restore();
    }
  }
}

// src/compositing.ts
function modulatePixels(destination, source) {
  const output = new Uint8ClampedArray(destination.length);
  for (let i = 0; i < output.length; i += 4) {
    const alpha = destination[i + 3] * source[i + 3] / 255;
    output[i + 3] = alpha;
    if (alpha) for (let c = 0; c < 3; c++) output[i + c] = destination[i + c] * source[i + c] / 255;
  }
  return output;
}
function compositeLayer(ctx, layer, tint, mode) {
  if (mode === "DST") return;
  if (tint) {
    const target = layer.getContext("2d");
    target.globalCompositeOperation = "source-in";
    target.fillStyle = parseColor(tint);
    target.fillRect(0, 0, layer.width, layer.height);
  }
  if (mode === "MODULATE") {
    const plane = new OffscreenCanvas(ctx.canvas.width, ctx.canvas.height), target = plane.getContext("2d");
    target.setTransform(ctx.getTransform());
    target.globalAlpha = ctx.globalAlpha;
    target.drawImage(layer, 0, 0);
    const source = target.getImageData(0, 0, plane.width, plane.height);
    const destination = ctx.getImageData(0, 0, plane.width, plane.height);
    source.data.set(modulatePixels(destination.data, source.data));
    target.resetTransform();
    target.putImageData(source, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, layer.width, layer.height);
    ctx.clip();
    ctx.resetTransform();
    ctx.globalCompositeOperation = "copy";
    ctx.globalAlpha = 1;
    ctx.drawImage(plane, 0, 0);
    ctx.restore();
  } else if (mode === "CLEAR") {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, layer.width, layer.height);
    ctx.restore();
  } else {
    ctx.save();
    try {
      if (mode) {
        ctx.beginPath();
        ctx.rect(0, 0, layer.width, layer.height);
        ctx.clip();
      }
      ctx.drawImage(layer, 0, 0);
    } finally {
      ctx.restore();
    }
  }
}

// src/clock.ts
function secondHandAngle(el, second, millisecond, ambient) {
  const sweep = el.querySelector(":scope > Sweep"), tick = el.querySelector(":scope > Tick");
  const fraction = millisecond / 1e3;
  if (!ambient && sweep) {
    const frequency = sweep.getAttribute("frequency") === "SYNC_TO_DEVICE" ? 1e3 : number(sweep, "frequency", 15);
    return (second + Math.floor(fraction * frequency) / frequency) * 6;
  }
  if (!ambient && tick) {
    const t = Math.min(1, fraction / Math.max(1e-3, number(tick, "duration", 0.2)));
    const strength = number(tick, "strength", 1), p = t - 1;
    return (second + (1 + strength * 1.70158) * p * p * p + strength * 1.70158 * p * p) * 6;
  }
  return second * 6;
}
async function renderAnalogClock(ctx, el, renderChild, renderCtx) {
  for (const child of el.children) {
    const tag = child.tagName;
    if (["HourHand", "MinuteHand", "SecondHand"].includes(tag)) {
      const local = renderCtx.contexts?.get(child) ?? renderCtx.expressionCtx;
      const sources = local.sources;
      const hour = Number(sources.HOUR_0_23 ?? 0), minute = Number(sources.MINUTE ?? 0), second = Number(sources.SECOND ?? 0);
      const angle = tag === "HourHand" ? (hour % 12 + minute / 60) * 30 : tag === "MinuteHand" ? (minute + second / 60) * 6 : secondHandAngle(child, second, Number(sources.MILLISECOND ?? 0), renderCtx.ambient);
      await renderHand(ctx, child, angle, renderChild, { ...renderCtx, expressionCtx: local });
    } else await renderChild(ctx, child, renderCtx);
  }
}
async function renderHand(ctx, el, angle, renderChild, renderCtx) {
  if (number(el, "alpha", 255) <= 0) return;
  const w = number(el, "width"), h = number(el, "height");
  ctx.save();
  try {
    applyGeometry(ctx, el);
    const px = number(el, "pivotX", 0.5) * w, py = number(el, "pivotY", 0.5) * h;
    ctx.translate(px, py);
    ctx.rotate(angle * Math.PI / 180);
    ctx.translate(-px, -py);
    const draw = async (target, local) => {
      const resource = el.getAttribute("resource");
      if (resource) {
        const bitmap = await getOrDecodeImage(resource, local.assets);
        if (bitmap) target.drawImage(bitmap, 0, 0, w, h);
      }
      for (const child of el.children) await renderChild(target, child, local);
    };
    const tint = el.getAttribute("tintColor");
    if (tint && w > 0 && h > 0) {
      const layer = new OffscreenCanvas(Math.ceil(w), Math.ceil(h));
      const basis = renderCtx.basis ? renderCtx.basis.multiply(ctx.getTransform()) : ctx.getTransform();
      await draw(layer.getContext("2d"), { ...renderCtx, basis });
      compositeLayer(ctx, layer, tint, null);
    } else await draw(ctx, renderCtx);
  } finally {
    ctx.restore();
  }
}

// src/shapes.ts
function resolveColorExprs(el, expressionCtx) {
  for (const child of el.children) {
    if (child.tagName !== "Fill" && child.tagName !== "Stroke") continue;
    const color = child.getAttribute("color");
    if (!color?.includes("[")) continue;
    const resolved = color.replace(/\[([^\]]+)\]/g, (_, name) => {
      const val = expressionCtx.sources[name];
      return val !== void 0 ? String(val) : "#000000";
    });
    child.setAttribute("color", resolved);
  }
}
async function renderElement(ctx, el, renderCtx) {
  const local = renderCtx.contexts?.get(el);
  if (local) renderCtx = { ...renderCtx, expressionCtx: local };
  if (!renderCtx.contexts) {
    applyVariants(el, renderCtx.ambient);
    applyTransforms(el, renderCtx.expressionCtx, renderCtx.elapsedMs);
    resolveColorExprs(el, renderCtx.expressionCtx);
  }
  if (Number(el.getAttribute("alpha") ?? 255) <= 0) return;
  const savedContext = ctx;
  ctx.save();
  try {
    const tag = el.tagName;
    const container = ["Group", "PartDraw", "Scene", "PartText", "PartImage", "PartAnimatedImage", "DigitalClock", "AnalogClock", "ComplicationSlot"].includes(tag);
    if (tag === "ComplicationSlot" && !renderCtx.contexts?.has(el)) return;
    if (container) {
      applyGeometry(ctx, el);
      renderCtx.register?.(ctx, el, renderCtx);
    }
    applyBlendMode(ctx, el);
    const tint = el.getAttribute("tintColor"), blend = el.getAttribute("blendMode");
    const layered = container && (tint !== null || blend !== null);
    const destination = ctx;
    if (layered) {
      const w = Number(el.getAttribute("width") ?? ctx.canvas.width), h = Number(el.getAttribute("height") ?? ctx.canvas.height);
      if (w <= 0 || h <= 0) return;
      const layer = new OffscreenCanvas(Math.ceil(w), Math.ceil(h));
      renderCtx = { ...renderCtx, basis: renderCtx.basis ? renderCtx.basis.multiply(ctx.getTransform()) : ctx.getTransform() };
      ctx = layer.getContext("2d");
    }
    switch (tag) {
      case "Scene":
      case "Group":
      case "PartDraw":
      case "ComplicationSlot":
      case "Complication":
        await renderGroup(ctx, el, renderElement, renderCtx);
        break;
      case "Condition":
        await renderCondition(ctx, el, renderElement, renderCtx);
        break;
      case "ListConfiguration":
      case "BooleanConfiguration":
        for (const option of el.children) for (const child of option.children) await renderElement(ctx, child, renderCtx);
        break;
      case "Arc":
        if (!renderWeightedStroke(ctx, el)) renderArc(ctx, el);
        break;
      case "Rectangle":
        renderRectangle(ctx, el);
        break;
      case "RoundRectangle":
        renderRoundRectangle(ctx, el);
        break;
      case "Ellipse":
        renderEllipse(ctx, el);
        break;
      case "Line":
        if (!renderWeightedStroke(ctx, el)) renderLine(ctx, el);
        break;
      case "PartText":
        await renderPartText(ctx, el, renderCtx);
        break;
      case "DigitalClock":
        await renderDigitalClock(ctx, el, renderCtx);
        break;
      case "PartImage":
      case "PartAnimatedImage":
        await renderPartImage(ctx, el, renderCtx, renderCtx.assets);
        break;
      case "AnalogClock":
        await renderAnalogClock(ctx, el, renderElement, renderCtx);
        break;
    }
    if (layered) compositeLayer(destination, ctx.canvas, tint, blend);
    ctx = destination;
  } finally {
    savedContext.restore();
  }
}
function renderRectangle(ctx, el) {
  const x = parseFloat(el.getAttribute("x") ?? "0");
  const y = parseFloat(el.getAttribute("y") ?? "0");
  const w = parseFloat(el.getAttribute("width") ?? "0");
  const h = parseFloat(el.getAttribute("height") ?? "0");
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  applyFill(ctx, el);
  applyStroke(ctx, el);
}
function renderRoundRectangle(ctx, el) {
  const x = parseFloat(el.getAttribute("x") ?? "0");
  const y = parseFloat(el.getAttribute("y") ?? "0");
  const w = parseFloat(el.getAttribute("width") ?? "0");
  const h = parseFloat(el.getAttribute("height") ?? "0");
  const rx = parseFloat(el.getAttribute("cornerRadiusX") ?? "0");
  const ry = parseFloat(el.getAttribute("cornerRadiusY") ?? rx.toString());
  ctx.beginPath();
  const radius = { x: rx, y: ry };
  ctx.roundRect(x, y, w, h, [radius, radius, radius, radius]);
  applyFill(ctx, el);
  applyStroke(ctx, el);
}
function renderArc(ctx, el) {
  const cx = parseFloat(el.getAttribute("centerX") ?? "0");
  const cy = parseFloat(el.getAttribute("centerY") ?? "0");
  const w = parseFloat(el.getAttribute("width") ?? "0");
  const h = parseFloat(el.getAttribute("height") ?? "0");
  const startAngle = parseFloat(el.getAttribute("startAngle") ?? "0");
  const endAngle = parseFloat(el.getAttribute("endAngle") ?? "360");
  const direction = el.getAttribute("direction") ?? "CLOCKWISE";
  const startRad = (startAngle - 90) * Math.PI / 180;
  const endRad = (endAngle - 90) * Math.PI / 180;
  const counterclockwise = direction === "COUNTER_CLOCKWISE";
  ctx.beginPath();
  if (w === h) {
    ctx.arc(cx, cy, w / 2, startRad, endRad, counterclockwise);
  } else {
    ctx.ellipse(cx, cy, w / 2, h / 2, 0, startRad, endRad, counterclockwise);
  }
  applyFill(ctx, el);
  applyStroke(ctx, el);
}
function renderEllipse(ctx, el) {
  const x = parseFloat(el.getAttribute("x") ?? "0");
  const y = parseFloat(el.getAttribute("y") ?? "0");
  const w = parseFloat(el.getAttribute("width") ?? "0");
  const h = parseFloat(el.getAttribute("height") ?? "0");
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  applyFill(ctx, el);
  applyStroke(ctx, el);
}
function renderLine(ctx, el) {
  const x1 = parseFloat(el.getAttribute("startX") ?? "0");
  const y1 = parseFloat(el.getAttribute("startY") ?? "0");
  const x2 = parseFloat(el.getAttribute("endX") ?? "0");
  const y2 = parseFloat(el.getAttribute("endY") ?? "0");
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  applyStroke(ctx, el);
}

// src/complications.ts
function selectedComplication(slot, preview) {
  const id = Number(slot.getAttribute("slotId"));
  if (!preview?.activeSlotIds.has(id)) return;
  const data = preview.data[id];
  if (!data) return;
  const supported = slot.getAttribute("supportedTypes")?.trim().split(/\s+/);
  if (supported && !supported.includes(data.type)) throw new Error(`Unsupported complication type ${data.type} for slot ${id}`);
  return data;
}
function complicationContext(ctx, data) {
  const sources = { ...ctx.sources };
  for (const key of Object.keys(sources)) if (key.startsWith("COMPLICATION.")) delete sources[key];
  for (const [key, value] of Object.entries(data.data ?? {})) sources[key.startsWith("COMPLICATION.") ? key : `COMPLICATION.${key}`] = typeof value === "boolean" ? Number(value) : value;
  return { ...ctx, sources };
}

// src/scene.ts
function prepareScene(scene, base, ambient, elapsed, states, ambientTransitionDurationMs = 1e3, complications) {
  const contexts = /* @__PURE__ */ new WeakMap();
  const pending = /* @__PURE__ */ new Set(), done = /* @__PURE__ */ new Set();
  const providers = /* @__PURE__ */ new Map();
  for (const ref of scene.querySelectorAll("Reference")) {
    const name = ref.getAttribute("name");
    if (!name) continue;
    if (providers.has(name)) throw new Error(`Duplicate Reference: ${name}`);
    providers.set(name, ref);
  }
  const keys = /* @__PURE__ */ new WeakMap();
  function assign(el, key) {
    keys.set(el, key);
    el.setAttribute("data-wff-key", key);
    Array.from(el.children).forEach((c, i) => assign(c, `${key}/${i}`));
  }
  assign(scene, "scene");
  function context(sources, rest) {
    return { ...rest, sources: new Proxy(sources, { get(target, prop) {
      if (!prop.startsWith("REFERENCE.")) return target[prop];
      const ref = providers.get(prop.slice(10));
      if (!ref) return 0;
      const parent = ref.parentElement;
      const fallback = resolveValue(ref.getAttribute("defaultValue") ?? "0", rest);
      if (!visible(parent)) return Number.isFinite(Number(fallback)) ? Number(fallback) : fallback;
      prepare(parent);
      if (number(parent, "alpha", 255) <= 0) return Number.isFinite(Number(fallback)) ? Number(fallback) : fallback;
      const value = parent.getAttribute(ref.getAttribute("source") ?? "") ?? String(fallback);
      return Number.isFinite(Number(value)) ? Number(value) : value;
    } }) };
  }
  const branchCache = /* @__PURE__ */ new WeakMap();
  function branch(el) {
    if (branchCache.has(el)) return branchCache.get(el);
    prepare(el);
    const ctx = contexts.get(el);
    let selected = null;
    if (el.tagName === "Condition") {
      for (const expression2 of el.querySelector(":scope > Expressions")?.children ?? []) {
        ctx.sources[expression2.getAttribute("name") ?? ""] = evaluateExpression(expression2.getAttribute("expression") ?? expression2.textContent?.trim() ?? "0", ctx);
      }
      selected = Array.from(el.children).find((c) => c.tagName === "Compare" && Boolean(evaluateExpression(c.getAttribute("expression") ?? "0", ctx))) ?? el.querySelector(":scope > Default");
    } else {
      const value = ctx.sources[`CONFIGURATION.${el.getAttribute("id")}`];
      const id = el.tagName === "BooleanConfiguration" ? value ? "TRUE" : "FALSE" : String(value);
      selected = Array.from(el.children).find((c) => c.getAttribute("id") === id) ?? null;
    }
    branchCache.set(el, selected);
    return selected;
  }
  function visible(el) {
    if (el === scene) return true;
    if (el.tagName === "ComplicationSlot" && !selectedComplication(el, complications)) return false;
    if (el.tagName === "Complication" && (el.parentElement?.tagName !== "ComplicationSlot" || selectedComplication(el.parentElement, complications)?.type !== el.getAttribute("type"))) return false;
    const parent = el.parentElement;
    if (!parent || !scene.contains(parent)) return false;
    if (!visible(parent)) return false;
    if (["Compare", "Default", "ListOption", "BooleanOption"].includes(el.tagName) && branch(parent) !== el) return false;
    prepare(parent);
    return number(parent, "alpha", 255) > 0;
  }
  function prepare(el) {
    if (done.has(el)) return;
    if (pending.has(el)) throw new Error(`Cyclic Reference dependency at ${keys.get(el)}`);
    pending.add(el);
    const parent = el.parentElement;
    if (parent && scene.contains(parent)) prepare(parent);
    let inherited = parent ? contexts.get(parent) ?? base : base;
    if (el.tagName === "ComplicationSlot") {
      const data = selectedComplication(el, complications);
      if (data) inherited = complicationContext(inherited, data);
    }
    const localization = el.querySelector(":scope > Localization");
    const locales = localization?.getAttribute("locales")?.split(/\s+/).map((l) => l.replace(/_/g, "-"));
    const zone = localization?.getAttribute("timeZone");
    const calendar = localization?.getAttribute("calendar")?.toLowerCase().replace(/_/g, "-").replace("gregorian", "gregory").replace("ethiopic-amete-alem", "ethioaa");
    const ctx = context({ ...inherited.sources }, {
      ...inherited,
      locale: locales?.find((l) => l === inherited.locale) ?? locales?.[0] ?? inherited.locale,
      timeZone: zone && zone !== "SYNC_TO_DEVICE" ? zone : inherited.timeZone,
      calendar: calendar ?? inherited.calendar
    });
    if (localization) {
      const localized = localizedDataSources(new Date(Number(inherited.sources.UTC_TIMESTAMP)), {}, Boolean(inherited.sources.IS_24_HOUR_MODE), ctx.locale, ctx.timeZone, ctx.calendar);
      for (const [name, value] of Object.entries(localized.sources)) ctx.sources[name] = value;
    }
    contexts.set(el, ctx);
    if (!["Transform", "Variant", "Gyro", "Reference", "Localization", "Parameter"].includes(el.tagName)) applyAttributes(el, ctx, ambient, elapsed, states, keys.get(el), ambientTransitionDurationMs);
    pending.delete(el);
    done.add(el);
  }
  function walk(el) {
    if (!visible(el) && el !== scene) return;
    prepare(el);
    if (["Condition", "ListConfiguration", "BooleanConfiguration"].includes(el.tagName)) {
      const selected = branch(el);
      for (const child of Array.from(el.children)) if (child !== selected) child.remove();
      if (selected) for (const child of selected.children) walk(child);
    } else for (const child of Array.from(el.children)) {
      if (["ComplicationSlot", "Complication"].includes(child.tagName) && !visible(child)) child.remove();
      else walk(child);
    }
  }
  walk(scene);
  return contexts;
}

// src/configuration.ts
var ids = (value) => value?.trim().split(/[\s,]+/).filter(Boolean) ?? [];
function prepareConfigurations(doc, overrides = {}, flavorId) {
  const values = {};
  const settings = [];
  const user = doc.querySelector("UserConfigurations");
  const flavors = user?.querySelector(":scope > Flavors");
  const selectedFlavor = flavorId ?? flavors?.getAttribute("defaultFlavor") ?? flavors?.getAttribute("defaultValue");
  const flavor = Array.from(flavors?.children ?? []).find((f) => f.getAttribute("id") === selectedFlavor);
  if (flavorId && !flavor) throw new Error(`Unknown flavor: ${flavorId}`);
  const preset = {};
  for (const conf of flavor?.querySelectorAll(":scope > Configuration") ?? []) preset[conf.getAttribute("id") ?? ""] = conf.getAttribute("optionId") ?? "";
  for (const child of user?.children ?? []) {
    if (!["BooleanConfiguration", "ColorConfiguration", "ListConfiguration", "PhotosConfiguration"].includes(child.tagName)) continue;
    const id = child.getAttribute("id");
    if (!id) continue;
    if (settings.some((s) => s.id === id)) throw new Error(`Duplicate setting: ${id}`);
    const selected = overrides[id] ?? preset[id] ?? child.getAttribute("defaultValue");
    const options = [];
    if (child.tagName === "BooleanConfiguration") values[id] = boolean(String(selected ?? "TRUE")) ? 1 : 0;
    else if (child.tagName === "ColorConfiguration" || child.tagName === "ListConfiguration") {
      const optionTag = child.tagName === "ColorConfiguration" ? "ColorOption" : "ListOption";
      const entries = Array.from(child.children).filter((c) => c.tagName === optionTag);
      const option = entries.find((c) => c.getAttribute("id") === String(selected)) ?? (selected == null ? entries[0] : void 0);
      if (!option && entries.length) throw new Error(`Unknown option ${selected} for ${id}`);
      values[id] = option?.getAttribute("id") ?? String(selected ?? "0");
      if (child.tagName === "ColorConfiguration") ids(option?.getAttribute("colors") ?? null).forEach((color, i) => {
        values[`${id}.${i}`] = color;
      });
      for (const entry of entries) options.push({
        id: entry.getAttribute("id") ?? "",
        childSettingIds: ids(entry.getAttribute("childSettingIds")),
        complicationSlotIds: ids(entry.getAttribute("complicationSlotIds")).map((slot) => {
          if (!/^\d+$/.test(slot) || !Number.isSafeInteger(Number(slot))) throw new Error(`Invalid complication slot ID: ${slot}`);
          return Number(slot);
        })
      });
    } else values[id] = id;
    settings.push({ id, value: values[id], active: false, options });
  }
  for (const [key, value] of Object.entries(overrides)) if (!(key in values)) values[key] = value;
  const byId = new Map(settings.map((s) => [s.id, s]));
  const children = (setting) => Array.from(new Set(setting.options.flatMap((o) => o.childSettingIds)));
  const nested = new Set(settings.flatMap(children));
  function validate(setting, path) {
    if (path.includes(setting.id)) throw new Error(`Cyclic setting hierarchy: ${[...path, setting.id].join(" -> ")}`);
    if (path.length > 2) throw new Error("Setting hierarchy exceeds Parent -> Child -> Grandchild");
    for (const id of children(setting)) {
      const child = byId.get(id);
      if (!child) throw new Error(`Unknown child setting: ${id}`);
      validate(child, [...path, setting.id]);
    }
  }
  for (const setting of settings) validate(setting, []);
  function activate(setting) {
    if (setting.active) return;
    setting.active = true;
    const option = setting.options.find((o) => o.id === String(setting.value));
    for (const id of option?.childSettingIds ?? []) activate(byId.get(id));
  }
  settings.filter((s) => !nested.has(s.id)).forEach(activate);
  const linked = new Set(settings.flatMap((s) => s.options.flatMap((o) => o.complicationSlotIds)));
  const enabled = new Set(settings.filter((s) => s.active).flatMap((s) => s.options.find((o) => o.id === String(s.value))?.complicationSlotIds ?? []));
  const slots = Array.from(doc.querySelectorAll("Scene ComplicationSlot")).map((s) => Number(s.getAttribute("slotId"))).filter((id) => !linked.has(id) || enabled.has(id));
  return { values, settings, activeComplicationSlotIds: Array.from(new Set(slots)) };
}

// src/index.ts
var activeCanvases = /* @__PURE__ */ new WeakMap();
function stringsFromAssets(options) {
  const result = {};
  const language = (options.locale ?? "en-US").split("-")[0];
  for (const qualifier of ["values", `values-${language}`]) {
    const buffer = options.assets?.get(`res/${qualifier}/strings.xml`) ?? options.assets?.get(`${qualifier}/strings.xml`);
    if (!buffer) continue;
    const doc = new DOMParser().parseFromString(new TextDecoder().decode(buffer), "text/xml");
    for (const el of doc.querySelectorAll("string")) result[el.getAttribute("name") ?? ""] = (el.textContent ?? "").replace(/\\n/g, "\n").replace(/\\'/g, "'");
  }
  return { ...result, ...options.strings };
}
async function renderWatchFace(canvas, initial) {
  activeCanvases.get(canvas)?.stop();
  let options = { ...initial };
  let stopped = false, raf = 0, queue = Promise.resolve();
  const start = performance.now();
  const states = /* @__PURE__ */ new Map(), imageStates = /* @__PURE__ */ new Map(), events = /* @__PURE__ */ new Map();
  const hits = [];
  let hitClip;
  const result = { metadata: /* @__PURE__ */ new Map(), accessibility: [], settings: [], activeComplicationSlotIds: [], update, tap, stop };
  let wasVisible = options.visible !== false;
  let hiddenAt, pausedMs = 0, frameId = 0, timeAnchorElapsed = 0;
  async function draw() {
    if (stopped) return;
    frameId++;
    const doc = new DOMParser().parseFromString(options.xml, "text/xml"), root = doc.documentElement;
    if (root.tagName === "parsererror" || root.querySelector("parsererror")) throw new Error("Invalid WFF XML: " + root.textContent?.slice(0, 200));
    const xmlWidth = number(root, "width", 450), xmlHeight = number(root, "height", 450);
    const width = options.width ?? xmlWidth, height = options.height ?? xmlHeight;
    if (![xmlWidth, xmlHeight, width, height].every((v) => Number.isFinite(v) && v > 0)) throw new Error("WatchFace dimensions must be positive finite numbers");
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const ctx = canvas.getContext("2d");
    const config = prepareConfigurations(doc, options.configuration, options.flavor);
    result.settings = config.settings;
    result.activeComplicationSlotIds = config.activeComplicationSlotIds;
    result.metadata.clear();
    for (const el of root.querySelectorAll("Metadata")) result.metadata.set(el.getAttribute("key") ?? "", el.getAttribute("value") ?? "");
    hits.length = 0;
    hitClip = void 0;
    result.accessibility.length = 0;
    const realElapsed = options.elapsedMs ?? performance.now() - start;
    const visible = options.visible !== false;
    if (!visible && wasVisible) hiddenAt = realElapsed;
    if (visible && !wasVisible) {
      pausedMs += realElapsed - (hiddenAt ?? realElapsed);
      hiddenAt = void 0;
      events.set("ON_VISIBLE", (events.get("ON_VISIBLE") ?? 0) + 1);
    }
    wasVisible = visible;
    if (!ctx || !visible) {
      for (const state of imageStates.values()) if (state.hiddenAt === void 0) state.hiddenAt = realElapsed - pausedMs;
      return;
    }
    const elapsed = options.elapsedMs ?? realElapsed - pausedMs;
    const time = options.time ? new Date(options.time.getTime() + (options.animate && options.elapsedMs === void 0 ? Math.max(0, elapsed - timeAnchorElapsed) : 0)) : /* @__PURE__ */ new Date();
    const expressionCtx = localizedDataSources(time, config.values, options.is24Hour, options.locale, options.timeZone, options.calendar);
    expressionCtx.currency = options.currency;
    expressionCtx.strings = stringsFromAssets(options);
    expressionCtx.random = options.random;
    const injected = typeof options.dataSources === "function" ? options.dataSources(time) : options.dataSources;
    for (const [key, value] of Object.entries(injected ?? {})) expressionCtx.sources[key] = typeof value === "boolean" ? Number(value) : value;
    const scene = root.querySelector(":scope > Scene");
    if (!scene) return;
    if (!scene.hasAttribute("width")) scene.setAttribute("width", String(xmlWidth));
    if (!scene.hasAttribute("height")) scene.setAttribute("height", String(xmlHeight));
    const contexts = prepareScene(scene, expressionCtx, options.ambient ?? false, elapsed, states, options.ambientTransitionDurationMs, { activeSlotIds: new Set(config.activeComplicationSlotIds), data: options.complications ?? {} });
    await loadFonts(doc, options.assets ?? /* @__PURE__ */ new Map());
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    try {
      ctx.scale(width / xmlWidth, height / xmlHeight);
      const clip = new Path2D();
      if ((root.getAttribute("clipShape") ?? "CIRCLE") === "CIRCLE") clip.arc(xmlWidth / 2, xmlHeight / 2, Math.min(xmlWidth, xmlHeight) / 2, 0, 2 * Math.PI);
      else clip.roundRect(0, 0, xmlWidth, xmlHeight, { x: root.getAttribute("clipShape") === "RECTANGLE" ? number(root, "cornerRadiusX") : 0, y: root.getAttribute("clipShape") === "RECTANGLE" ? number(root, "cornerRadiusY") : 0 });
      ctx.clip(clip);
      hitClip = { path: clip, ctx, scaleX: width / xmlWidth, scaleY: height / xmlHeight };
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = parseColor(scene.getAttribute("backgroundColor") ?? "#000000");
      ctx.fillRect(0, 0, xmlWidth, xmlHeight);
      const renderCtx = {
        expressionCtx,
        contexts,
        ambient: options.ambient ?? false,
        assets: options.assets ?? /* @__PURE__ */ new Map(),
        elapsedMs: elapsed,
        frameId,
        events,
        imageStates,
        photos: options.photos,
        random: options.random,
        register(target, el, local) {
          const w = number(el, "width"), h = number(el, "height"), transform = local.basis ? local.basis.multiply(target.getTransform()) : target.getTransform();
          const launch = el.querySelector(":scope > Launch")?.getAttribute("target") ?? void 0;
          const hasEvents = el.querySelector("Images, Photos, AnimatedImages, AnimationController");
          if ((launch || hasEvents) && w > 0 && h > 0) hits.push({ key: el.getAttribute("data-wff-key") ?? "", inverse: transform.inverse(), width: w, height: h, launch });
          const reader = el.querySelector(":scope > ScreenReader");
          if (reader) {
            const id = reader.getAttribute("stringId") ?? "";
            const values = Array.from(reader.children).filter((c) => c.tagName === "Parameter").map((c) => templateParameter(c, local));
            const text = formatTemplate(local.expressionCtx.strings?.[id.replace(/^@string\//, "")] ?? id, values, local.expressionCtx);
            const corners = [[0, 0], [w, 0], [0, h], [w, h]].map(([x2, y2]) => transform.transformPoint({ x: x2, y: y2 }));
            const x = Math.min(...corners.map((p) => p.x)), y = Math.min(...corners.map((p) => p.y));
            result.accessibility.push({ name: el.getAttribute("name") ?? id, text, bounds: { x, y, width: Math.max(...corners.map((p) => p.x)) - x, height: Math.max(...corners.map((p) => p.y)) - y }, launchTarget: launch });
          }
        }
      };
      await renderElement(ctx, scene, renderCtx);
      for (const state of imageStates.values()) if (state.lastSeen !== frameId && state.hiddenAt === void 0) state.hiddenAt = elapsed;
      if (result.accessibility.length) {
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", result.accessibility.map((a) => a.text).join("; "));
      } else canvas.removeAttribute("aria-label");
    } finally {
      ctx.restore();
    }
  }
  function schedule() {
    queue = queue.catch(() => {
    }).then(draw);
    return queue;
  }
  function update(changes) {
    if (changes.xml !== void 0 && changes.xml !== options.xml) {
      states.clear();
      imageStates.clear();
      events.clear();
    }
    if (changes.time !== void 0) timeAnchorElapsed = changes.elapsedMs ?? options.elapsedMs ?? performance.now() - start - pausedMs;
    const wasAnimating = options.animate;
    options = { ...options, ...changes };
    if (changes.animate === false) cancelAnimationFrame(raf);
    if (changes.animate && !wasAnimating && !stopped) raf = requestAnimationFrame(() => {
      void frame();
    });
    return schedule();
  }
  async function tap(x, y) {
    if (stopped || options.ambient || options.visible === false) return;
    if (hitClip && !hitClip.ctx.isPointInPath(hitClip.path, x / hitClip.scaleX, y / hitClip.scaleY)) return;
    for (const hit of [...hits].reverse()) {
      const point = hit.inverse.transformPoint({ x, y });
      if (point.x >= 0 && point.y >= 0 && point.x <= hit.width && point.y <= hit.height) {
        events.set(`TAP:${hit.key}`, (events.get(`TAP:${hit.key}`) ?? 0) + 1);
        if (hit.launch) options.onLaunch?.(hit.launch);
        await schedule();
        return;
      }
    }
  }
  function stop() {
    stopped = true;
    cancelAnimationFrame(raf);
    canvas.removeEventListener("click", click);
    if (activeCanvases.get(canvas) === result) activeCanvases.delete(canvas);
  }
  function click(event) {
    const rect = canvas.getBoundingClientRect();
    void tap((event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height).catch((error) => options.onError?.(error));
  }
  canvas.addEventListener("click", click);
  try {
    await schedule();
  } catch (error) {
    stop();
    throw error;
  }
  const frame = async () => {
    if (stopped) return;
    try {
      await schedule();
    } catch (error) {
      stop();
      options.onError?.(error);
      return;
    }
    if (!stopped && options.animate) raf = requestAnimationFrame(() => {
      void frame();
    });
  };
  if (options.animate) raf = requestAnimationFrame(() => {
    void frame();
  });
  activeCanvases.set(canvas, result);
  return result;
}
function templateParameter(el, ctx) {
  const wrapper = el.ownerDocument.createElement("Template");
  wrapper.append("%s");
  wrapper.append(el.cloneNode());
  return template(wrapper, ctx.expressionCtx);
}
export {
  renderWatchFace
};
