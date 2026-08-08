import { t } from "./i18n.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const DEGREES_TO_RADIANS = Math.PI / 180;
const STANDARD_PARALLEL = Math.acos(2 / Math.PI);
const PROJECTION_SCALE = 100;
const EXCLUDED_TERRITORIES = new Set(["ATA"]);
const MIN_WIDTH = 26;
const NEUTRAL_FILL = "#d3cfbe";

function project(longitude, latitude) {
  const lambda = longitude * DEGREES_TO_RADIANS;
  const phi = latitude * DEGREES_TO_RADIANS;
  const alpha = Math.acos(Math.max(-1, Math.min(1, Math.cos(phi) * Math.cos(lambda / 2))));
  const cardinal = alpha === 0 ? 1 : Math.sin(alpha) / alpha;
  const x = 0.5 * (lambda * Math.cos(STANDARD_PARALLEL) + (2 * Math.cos(phi) * Math.sin(lambda / 2)) / cardinal);
  const y = 0.5 * (phi + Math.sin(phi) / cardinal);
  return [x * PROJECTION_SCALE, -y * PROJECTION_SCALE];
}

function sampleLine(points) {
  return points
    .map((point, index) => {
      const [x, y] = project(point[0], point[1]);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join("");
}

function buildSpherePath() {
  const points = [];
  for (let latitude = -90; latitude <= 90; latitude += 1) {
    points.push([-180, latitude]);
  }
  for (let latitude = 90; latitude >= -90; latitude -= 1) {
    points.push([180, latitude]);
  }
  return `${sampleLine(points)}Z`;
}

function buildGraticulePath() {
  let path = "";
  for (let longitude = -180; longitude <= 180; longitude += 30) {
    const points = [];
    for (let latitude = -90; latitude <= 90; latitude += 2) {
      points.push([longitude, latitude]);
    }
    path += sampleLine(points);
  }
  for (let latitude = -60; latitude <= 60; latitude += 30) {
    const points = [];
    for (let longitude = -180; longitude <= 180; longitude += 2) {
      points.push([longitude, latitude]);
    }
    path += sampleLine(points);
  }
  return path;
}

function projectRing(ring, bounds) {
  let path = "";
  ring.forEach((point, index) => {
    const [x, y] = project(point[0], point[1]);
    if (x < bounds.minX) bounds.minX = x;
    if (x > bounds.maxX) bounds.maxX = x;
    if (y < bounds.minY) bounds.minY = y;
    if (y > bounds.maxY) bounds.maxY = y;
    path += `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return `${path}Z`;
}

function geometryToPath(geometry, bounds) {
  if (!geometry) {
    return "";
  }
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map((ring) => projectRing(ring, bounds)).join("");
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map((polygon) => polygon.map((ring) => projectRing(ring, bounds)).join("")).join("");
  }
  return "";
}

export class WorldMap {
  constructor(host, tooltipElement) {
    this.host = host;
    this.tooltipElement = tooltipElement;
    this.defaultView = { x: -270, y: -160, width: 540, height: 320 };
    this.view = { ...this.defaultView };
    this.paths = new Map();
    this.names = new Map();
    this.svg = null;
    this.pointerState = null;
  }

  async load(dataUrl) {
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error(t("errorMapData"));
    }
    const collection = await response.json();
    this.render(collection);
  }

  render(collection) {
    const svg = document.createElementNS(SVG_NAMESPACE, "svg");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const sphere = document.createElementNS(SVG_NAMESPACE, "path");
    sphere.setAttribute("d", buildSpherePath());
    sphere.setAttribute("class", "sphere");
    svg.appendChild(sphere);

    const graticule = document.createElementNS(SVG_NAMESPACE, "path");
    graticule.setAttribute("d", buildGraticulePath());
    graticule.setAttribute("class", "graticule");
    svg.appendChild(graticule);

    const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    const group = document.createElementNS(SVG_NAMESPACE, "g");
    collection.features.forEach((feature) => {
      if (EXCLUDED_TERRITORIES.has(feature.id)) {
        return;
      }
      const definition = geometryToPath(feature.geometry, bounds);
      if (!definition) {
        return;
      }
      const path = document.createElementNS(SVG_NAMESPACE, "path");
      path.setAttribute("d", definition);
      path.setAttribute("class", "land");
      path.style.fill = NEUTRAL_FILL;
      path.dataset.code = feature.id;
      group.appendChild(path);
      this.paths.set(feature.id, path);
      this.names.set(feature.id, feature.properties?.name || feature.id);
    });

    svg.appendChild(group);

    const padding = 14;
    this.defaultView = {
      x: bounds.minX - padding,
      y: bounds.minY - padding,
      width: bounds.maxX - bounds.minX + padding * 2,
      height: bounds.maxY - bounds.minY + padding * 2,
    };
    this.maxWidth = this.defaultView.width * 1.15;
    this.view = { ...this.defaultView };
    svg.setAttribute("viewBox", this.viewBoxValue());

    this.host.innerHTML = "";
    this.host.appendChild(svg);
    this.svg = svg;
    this.attachInteractions();
  }

  viewBoxValue() {
    return `${this.view.x} ${this.view.y} ${this.view.width} ${this.view.height}`;
  }

  applyView() {
    if (this.svg) {
      this.svg.setAttribute("viewBox", this.viewBoxValue());
    }
  }

  attachInteractions() {
    const svg = this.svg;

    svg.addEventListener("pointerdown", (event) => {
      this.pointerState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: this.view.x,
        originY: this.view.y,
      };
      svg.setPointerCapture(event.pointerId);
      svg.classList.add("is-dragging");
    });

    svg.addEventListener("pointermove", (event) => {
      if (this.pointerState && this.pointerState.pointerId === event.pointerId) {
        const bounds = svg.getBoundingClientRect();
        const scaleX = this.view.width / bounds.width;
        const scaleY = this.view.height / bounds.height;
        this.view.x = this.pointerState.originX - (event.clientX - this.pointerState.startX) * scaleX;
        this.view.y = this.pointerState.originY - (event.clientY - this.pointerState.startY) * scaleY;
        this.applyView();
        return;
      }
      this.showTooltip(event);
    });

    const endPointer = (event) => {
      if (this.pointerState && this.pointerState.pointerId === event.pointerId) {
        this.pointerState = null;
        svg.classList.remove("is-dragging");
      }
    };

    svg.addEventListener("pointerup", endPointer);
    svg.addEventListener("pointercancel", endPointer);
    svg.addEventListener("pointerleave", (event) => {
      endPointer(event);
      this.hideTooltip();
    });

    svg.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.zoom(event.deltaY > 0 ? 1.2 : 1 / 1.2);
    }, { passive: false });
  }

  showTooltip(event) {
    if (!this.tooltipElement) {
      return;
    }
    const target = event.target;
    if (!(target instanceof SVGPathElement) || !target.dataset.code) {
      this.hideTooltip();
      return;
    }
    const owner = target.dataset.owner;
    const label = owner ? `${owner} · ${this.names.get(target.dataset.code)}` : this.names.get(target.dataset.code);
    const bounds = this.host.getBoundingClientRect();
    this.tooltipElement.textContent = label;
    this.tooltipElement.style.left = `${event.clientX - bounds.left}px`;
    this.tooltipElement.style.top = `${event.clientY - bounds.top}px`;
    this.tooltipElement.hidden = false;
  }

  hideTooltip() {
    if (this.tooltipElement) {
      this.tooltipElement.hidden = true;
    }
  }

  zoom(factor) {
    const centerX = this.view.x + this.view.width / 2;
    const centerY = this.view.y + this.view.height / 2;
    const ratio = this.view.height / this.view.width;
    const nextWidth = Math.max(MIN_WIDTH, Math.min(this.maxWidth, this.view.width * factor));
    this.view.width = nextWidth;
    this.view.height = nextWidth * ratio;
    this.view.x = centerX - this.view.width / 2;
    this.view.y = centerY - this.view.height / 2;
    this.applyView();
  }

  resetView() {
    this.view = { ...this.defaultView };
    this.applyView();
  }

  focusOn(codes) {
    const points = [];
    codes.forEach((code) => {
      const path = this.paths.get(code);
      if (!path) {
        return;
      }
      const box = path.getBBox();
      points.push(box);
    });
    if (points.length === 0) {
      this.resetView();
      return;
    }
    const minX = Math.min(...points.map((box) => box.x));
    const minY = Math.min(...points.map((box) => box.y));
    const maxX = Math.max(...points.map((box) => box.x + box.width));
    const maxY = Math.max(...points.map((box) => box.y + box.height));
    const padding = 16;
    const width = Math.max(MIN_WIDTH, Math.min(this.maxWidth, maxX - minX + padding * 2));
    const height = width * (this.defaultView.height / this.defaultView.width);
    this.view = {
      x: (minX + maxX) / 2 - width / 2,
      y: (minY + maxY) / 2 - height / 2,
      width,
      height,
    };
    this.applyView();
  }

  paint(state, ownership, changedTerritories = []) {
    this.paths.forEach((path, code) => {
      const ownerCode = ownership[code];
      const owner = ownerCode ? state.nations[ownerCode] : null;
      path.style.fill = owner ? owner.color : NEUTRAL_FILL;
      path.classList.toggle("is-player", Boolean(owner) && owner.code === state.playerCode);
      if (owner) {
        path.dataset.owner = owner.name;
      } else {
        delete path.dataset.owner;
      }
      path.classList.remove("is-changed");
    });
    changedTerritories.forEach((code) => {
      const path = this.paths.get(code);
      if (path) {
        void path.offsetWidth;
        path.classList.add("is-changed");
      }
    });
  }
}
