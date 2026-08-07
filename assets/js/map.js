const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const DEFAULT_VIEW = { x: -180, y: -84, width: 360, height: 150 };
const MIN_WIDTH = 18;
const MAX_WIDTH = 380;
const NEUTRAL_FILL = "#c7cec3";

function projectRing(ring) {
  let path = "";
  ring.forEach((point, index) => {
    const x = point[0].toFixed(2);
    const y = (-point[1]).toFixed(2);
    path += `${index === 0 ? "M" : "L"}${x} ${y}`;
  });
  return `${path}Z`;
}

function geometryToPath(geometry) {
  if (!geometry) {
    return "";
  }
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map(projectRing).join("");
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((polygon) => polygon.map(projectRing).join(""))
      .join("");
  }
  return "";
}

export class WorldMap {
  constructor(host, tooltipElement) {
    this.host = host;
    this.tooltipElement = tooltipElement;
    this.view = { ...DEFAULT_VIEW };
    this.paths = new Map();
    this.names = new Map();
    this.svg = null;
    this.pointerState = null;
  }

  async load(dataUrl) {
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error("Harita verisi yüklenemedi.");
    }
    const collection = await response.json();
    this.render(collection);
  }

  render(collection) {
    const svg = document.createElementNS(SVG_NAMESPACE, "svg");
    svg.setAttribute("viewBox", this.viewBoxValue());
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const group = document.createElementNS(SVG_NAMESPACE, "g");
    collection.features.forEach((feature) => {
      const definition = geometryToPath(feature.geometry);
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
    const nextWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, this.view.width * factor));
    this.view.width = nextWidth;
    this.view.height = nextWidth * ratio;
    this.view.x = centerX - this.view.width / 2;
    this.view.y = centerY - this.view.height / 2;
    this.applyView();
  }

  resetView() {
    this.view = { ...DEFAULT_VIEW };
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
    const padding = 14;
    const width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, maxX - minX + padding * 2));
    const height = width * (DEFAULT_VIEW.height / DEFAULT_VIEW.width);
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
