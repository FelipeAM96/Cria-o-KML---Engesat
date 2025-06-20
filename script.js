// script.js

// Camadas base
const satelite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  { attribution: "Imagens © Esri & USGS" }
);

const mapa = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap",
});

// Inicializa mapa com satélite e foco no Brasil
const map = L.map("map", {
  center: [-15.235, -54.9253],
  zoom: 4,
  layers: [satelite],
});

let currentBase = satelite;

// Grupo para polígonos
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Função para focar no polígono selecionado
function focusPolygon(layer) {
  if (!layer) return;
  map.fitBounds(layer.getBounds(), { maxZoom: 16 });
}

// Atualiza lista de polígonos com área, botão focar e exportar
function updateList() {
  const list = document.getElementById("polygon-list");
  list.innerHTML = "";

  drawnItems.eachLayer((layer) => {
    const name = layer.feature?.properties?.name || "Sem nome";
    const geojson = layer.toGeoJSON();
    const area = turf.area(geojson);
    const areaKm2 = (area / 1_000_000).toFixed(4);

    const li = document.createElement("li");

    // Texto com nome + área
    const textSpan = document.createElement("span");
    textSpan.textContent = `${name} — Área: ${areaKm2} km²`;
    li.appendChild(textSpan);

    // Botão focar no polígono
    const focusBtn = document.createElement("button");
    focusBtn.textContent = "Focar";
    focusBtn.className = "btn-small";
    focusBtn.style.marginRight = "6px";
    focusBtn.onclick = () => focusPolygon(layer);
    li.appendChild(focusBtn);

    // Botão exportar KML
    const exportBtn = document.createElement("button");
    exportBtn.textContent = "Exportar KML";
    exportBtn.className = "btn-small";
    exportBtn.onclick = () => exportSingleKML(layer);
    li.appendChild(exportBtn);

    list.appendChild(li);
  });
}

// Exporta polígono individualmente em KML
function exportSingleKML(layer) {
  const feature = layer.toGeoJSON();
  const geojson = {
    type: "FeatureCollection",
    features: [feature],
  };

  const kml = tokml(geojson, {
    name: "name",
    description: "name",
  });

  const name = feature.properties.name || "poligono";
  const dataStr = "data:application/vnd.google-earth.kml+xml;charset=utf-8," + encodeURIComponent(kml);
  const dlAnchor = document.createElement("a");
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `${name}.kml`);
  dlAnchor.click();
}

// Ativa controles Leaflet.pm com botão home
map.pm.addControls({
  position: "topleft",
  drawPolygon: true,
  editMode: true,
  dragMode: true,
  removalMode: true,
  cutPolygon: false,
  drawMarker: false,
  drawCircle: false,
  drawCircleMarker: false,
  drawText: false,
  drawPolyline: false,
  drawRectangle: false,
});

// Botão Home personalizado no canto superior esquerdo
const homeControl = L.Control.extend({
  options: { position: "topleft" },
  onAdd: function () {
    const container = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-control-custom");
    container.style.backgroundColor = "white";
    container.style.width = "30px";
    container.style.height = "30px";
    container.style.cursor = "pointer";
    container.title = "Home";

    container.innerHTML = `<svg viewBox="0 0 24 24" style="width: 20px; height: 20px; margin: 5px;">
      <path fill="black" d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" />
    </svg>`;

    container.onclick = () => {
      map.setView([-15.235, -54.9253], 4);
    };

    return container;
  },
});

map.addControl(new homeControl());

// Criação do polígono
map.on("pm:create", (e) => {
  const layer = e.layer;
  const nome =
    prompt("Digite o nome do polígono:", `Polígono ${drawnItems.getLayers().length + 1}`) ||
    `Polígono ${drawnItems.getLayers().length + 1}`;

  layer.feature = {
    type: "Feature",
    properties: { name: nome },
    geometry: layer.toGeoJSON().geometry,
  };

  drawnItems.addLayer(layer);

  // Escuta edição para atualizar área
  layer.on("pm:edit pm:update pm:vertexedit", () => {
    layer.feature.geometry = layer.toGeoJSON().geometry;
    updateList();
  });

  updateList();
});

// Evento para remoção de camada (inclui borracha)
map.on("pm:remove", (e) => {
  if (e.layer) {
    drawnItems.removeLayer(e.layer);
  }
  updateList();
});

// Troca camadas base via seletor
document.querySelectorAll(".basemap-thumb").forEach((el) => {
  el.addEventListener("click", () => {
    map.removeLayer(currentBase);

    if (el.dataset.map === "streets") {
      currentBase = mapa;
    } else {
      currentBase = satelite;
    }

    map.addLayer(currentBase);

    // Atualiza estilo selecionado
    document.querySelectorAll(".basemap-thumb").forEach((el) => el.classList.remove("selected"));
    el.classList.add("selected");
  });
});

// Inicializa lista vazia
updateList();

// Integração do widget de busca
const geocoder = L.Control.geocoder({
  defaultMarkGeocode: false,
  position: "topleft",
  placeholder: "Buscar local...",
}).addTo(map);

geocoder.on("markgeocode", function (e) {
  const bbox = e.geocode.bbox;
  const poly = L.polygon([
    bbox.getSouthEast(),
    bbox.getNorthEast(),
    bbox.getNorthWest(),
    bbox.getSouthWest(),
  ]);
  map.fitBounds(poly.getBounds());
});

  map.fitBounds(poly.getBounds());
});

