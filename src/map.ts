import Map from 'ol/Map.js';
import View from 'ol/View.js';
import Feature from 'ol/Feature.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import VectorSource from 'ol/source/Vector.js';
import VectorLayer from 'ol/layer/Vector.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import { Fill, Stroke, Style, Circle as CircleStyle, Text } from 'ol/style.js';
import { Draw, Select, Modify } from 'ol/interaction.js';
import { click } from 'ol/events/condition.js';
import { defaults as defaultControls, ScaleLine } from 'ol/control.js';
import { getArea, getLength } from 'ol/sphere.js';
import type Geometry from 'ol/geom/Geometry.js';
import type { Collection } from './geojson';
import { demoFeatures, validateCollection } from './geojson';

export type Tool = 'select' | 'Point' | 'LineString' | 'Polygon' | 'modify';
export function createMap(target: HTMLElement, events: { change: () => void; select: (feature: Feature<Geometry> | null) => void; coordinate: (value: string) => void; tileError: () => void }) {
 const format = new GeoJSON(); const source = new VectorSource<Feature<Geometry>>();
 const style = new Style({ image: new CircleStyle({ radius: 7, fill: new Fill({ color: '#22664e' }), stroke: new Stroke({ color: '#ffffff', width: 3 }) }), fill: new Fill({ color: '#3c8d6740' }), stroke: new Stroke({ color: '#256b53', width: 3 }), text: new Text({ offsetY: -20, font: '12px sans-serif', fill: new Fill({ color: '#244c3b' }), stroke: new Stroke({ color: '#ffffff', width: 4 }) }) });
 const features = new VectorLayer({ source, style: (feature) => { style.getText()!.setText(String(feature.get('name') ?? '')); return style; } });
 // 示意园区自行生成，不是地理底图，也不承诺真实建筑位置。
 const blocks: unknown[] = [];
 for (let x = 0; x < 12; x++) for (let y = 0; y < 12; y++) {
  const lon = 121.459 + x * .0024; const lat = 31.216 + y * .0020;
  const park = (x + y) % 5 === 0;
  blocks.push({ type: 'Feature', properties: { kind: park ? 'park' : 'block' }, geometry: { type: 'Polygon', coordinates: [[[lon, lat], [lon + .0020, lat], [lon + .0020, lat + .0016], [lon, lat + .0016], [lon, lat]]] } });
  if (!park) for (let n = 0; n < 2; n++) {
   const left = lon + .00025 + n * .00085; const bottom = lat + .00025;
   blocks.push({ type: 'Feature', properties: { kind: 'building' }, geometry: { type: 'Polygon', coordinates: [[[left, bottom], [left + .0006, bottom], [left + .0006, bottom + .00105], [left, bottom + .00105], [left, bottom]]] } });
  }
 }
 blocks.push({ type: 'Feature', properties: { kind: 'river' }, geometry: { type: 'LineString', coordinates: [[121.473,31.212],[121.471,31.219],[121.475,31.227],[121.476,31.234],[121.480,31.243]] } });
 const background = new VectorLayer({ source: new VectorSource({ features: format.readFeatures({ type: 'FeatureCollection', features: blocks }, { featureProjection: 'EPSG:3857' }) }), style: (f) => {
  const kind = f.get('kind');
  if (kind === 'river') return new Style({ stroke: new Stroke({ color: '#b3d2d0', width: 25 }) });
  return new Style({ fill: new Fill({ color: kind === 'park' ? '#cadfc3' : kind === 'building' ? '#d9ded2' : '#e9eadd' }), stroke: new Stroke({ color: kind === 'building' ? '#ccd3c6' : '#dee2d5', width: 1 }) });
 } });
 const osm = new OSM(); const online = new TileLayer({ source: osm, visible: false }); osm.on('tileloaderror', events.tileError);
 const map = new Map({ target, layers: [background, online, features], controls: defaultControls({ attributionOptions: { collapsible: false } }).extend([new ScaleLine()]), view: new View({ center: fromLonLat([121.473, 31.230]), zoom: 15, minZoom: 2, maxZoom: 20 }) });
 // 使用即时 click，避免绘制结束后延迟的 singleclick 清除列表中刚选中的要素。
 const selection = new Select({ layers: [features], condition: click }); map.addInteraction(selection);
 const modify = new Modify({ features: selection.getFeatures() }); map.addInteraction(modify); modify.setActive(false);
 let draw: Draw | null = null; let mode: Tool = 'select';
 source.on(['addfeature', 'removefeature', 'changefeature'], events.change);
 selection.on('select', () => events.select(selection.getFeatures().item(0) ?? null));
 map.on('pointermove', (event) => { const [lon, lat] = toLonLat(event.coordinate); events.coordinate(`${lon!.toFixed(5)}, ${lat!.toFixed(5)}`); });
 function setTool(tool: Tool) {
  mode = tool; if (draw) { map.removeInteraction(draw); draw = null; }
  selection.setActive(tool === 'select' || tool === 'modify'); modify.setActive(tool === 'modify');
  if (tool === 'Point' || tool === 'LineString' || tool === 'Polygon') {
   selection.getFeatures().clear(); events.select(null); draw = new Draw({ source, type: tool });
   draw.on('drawend', (event) => { event.feature.setId(crypto.randomUUID()); event.feature.set('name', `${tool === 'Point' ? '标注' : tool === 'LineString' ? '路线' : '区域'} ${source.getFeatures().length + 1}`); });
   map.addInteraction(draw);
  }
 }
 function replace(collection: Collection) { setTool('select'); selection.getFeatures().clear(); events.select(null); source.clear(); source.addFeatures(format.readFeatures(collection, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' })); fit(); }
 function fit() { if (source.getFeatures().length) map.getView().fit(source.getExtent()!, { padding: [80, 60, 80, 60], maxZoom: 16, duration: 300 }); }
 function exportData(): Collection { return validateCollection(format.writeFeaturesObject(source.getFeatures(), { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857', decimals: 6 })); }
 function selected(): Feature<Geometry> | null { return selection.getFeatures().item(0) ?? null; }
 function choose(id: string) { const feature = source.getFeatureById(id); if (!feature) return; setTool('select'); selection.getFeatures().clear(); selection.getFeatures().push(feature); events.select(feature); map.getView().fit(feature.getGeometry()!.getExtent(), { maxZoom: 17, duration: 250 }); }
 function measure(feature: Feature<Geometry>): string { const geometry = feature.getGeometry()!; if (geometry.getType() === 'Polygon') return `${(getArea(geometry) / 10000).toFixed(2)} 公顷`; if (geometry.getType() === 'LineString') return `${getLength(geometry).toFixed(1)} 米`; return '点要素 · WGS84'; }
 queueMicrotask(() => replace(demoFeatures()));
 return { map, source, setTool, fit, replace, exportData, selected, choose, measure, getMode: () => mode, toggleOnline: (enabled: boolean) => online.setVisible(enabled), removeSelected: () => { const f = selected(); if (f) source.removeFeature(f); selection.getFeatures().clear(); events.select(null); }, clear: () => { setTool('select'); source.clear(); selection.getFeatures().clear(); events.select(null); }, reset: () => replace(demoFeatures()) };
}
