import 'ol/ol.css';
import './style.css';
import { createMap, type Tool } from './map';
import { validateCollection } from './geojson';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
$('app').innerHTML = `
<header class="topbar"><a class="brand" href="/">◈ <span>Map Lab<small>交互地图教学实验室</small></span></a><span class="edition">OPENLAYERS / LESSON 01</span><a href="#guide" class="guide-link">学习指引 ↗</a></header>
<main><aside class="panel"><div class="intro"><span class="eyebrow">LEARN BY EXPLORING</span><h1>把想法，放到地图上。</h1><p>从一个点开始，理解图层、交互与地理数据。</p></div>
<section><div class="section-head"><h2>交互工具</h2><span>01</span></div><div class="tools" aria-label="交互工具"><button data-tool="select" class="active">↖ 选择</button><button data-tool="Point">⊕ 标注点</button><button data-tool="LineString">⌁ 绘制线</button><button data-tool="Polygon">◇ 绘制面</button><button data-tool="modify">⤧ 编辑顶点</button><button id="fit">⊞ 适配视图</button></div><p id="tool-hint" class="hint">点击地图要素或下方列表查看属性。</p></section>
<section><div class="section-head"><h2>数据图层</h2><span id="feature-count">0 个要素</span></div><label class="toggle"><input id="online" type="checkbox"><span>OpenStreetMap 在线底图<small>需联网 · 显示提供方署名</small></span></label><div id="features" class="feature-list"></div></section>
<section id="inspector" hidden><div class="section-head"><h2>选中要素</h2><span id="geometry-type"></span></div><label for="feature-name">要素名称</label><input id="feature-name" maxlength="80"><p id="measure" class="hint"></p><div class="inline"><button id="rename">保存名称</button><button id="delete" class="danger">删除要素</button></div></section>
<section><div class="section-head"><h2>GeoJSON 数据</h2><span>02</span></div><div class="data-actions"><button id="export">↓ 导出 GeoJSON</button><button id="import">↑ 导入并替换</button><input id="file" type="file" accept=".geojson,.json,application/geo+json,application/json" hidden></div><div class="inline"><button id="reset" class="text-button">恢复示例</button><button id="clear" class="text-button danger">清空图层</button></div></section>
</aside><div class="map-column"><div class="map-heading"><div><span class="live-dot"></span><strong>教学园区 · 示意数据</strong></div><span id="basemap-mode">离线底图</span></div><div id="map" tabindex="0" aria-label="交互地图，使用侧边工具添加或选择要素"></div><div class="map-status"><span>EPSG:3857 <b>→</b> WGS84</span><output id="coordinates">移动指针查看经纬度</output></div><div id="message" role="status">示意底图不代表真实建筑或道路。所有操作都在本地完成。</div><section id="guide" class="guide"><span class="eyebrow">THREE THINGS TO TRY</span><div><article><b>01 / 图层与要素</b><p>选择「标注点」，点击地图新增；再切回选择工具，修改名称。</p></article><article><b>02 / 坐标与投影</b><p>地图显示使用 Web Mercator，GeoJSON 导入导出始终使用 WGS84。</p></article><article><b>03 / 数据往返</b><p>导出你的图层，再导入文件。多点线面可以一起保存。</p></article></div></section></div></main>
<dialog id="confirm"><h2 id="confirm-title">确认操作</h2><p>此操作会替换当前工作区的要素，请先导出需要保留的数据。</p><div class="inline"><button id="cancel">取消</button><button id="confirm-go" class="primary">确认</button></div></dialog>`;
const message = (text: string, error = false) => { $('message').textContent = text; $('message').classList.toggle('error', error); };
let refreshPending = false;
const app = createMap($('map'), {
 change: () => { if (!refreshPending) { refreshPending = true; queueMicrotask(() => { refreshPending = false; refresh(); }); } },
 select: (feature) => { $('inspector').hidden = !feature; if (feature) { $<HTMLInputElement>('feature-name').value = String(feature.get('name') ?? ''); $('geometry-type').textContent = feature.getGeometry()!.getType(); $('measure').textContent = app.measure(feature); } },
 coordinate: (value) => { $('coordinates').textContent = value; }, tileError: () => message('在线瓦片加载失败；可关闭在线底图，继续使用离线示例。', true),
});
const hints: Record<Tool, string> = { select: '点击地图要素或下方列表查看属性。', Point: '点击地图添加一个点，可连续添加。', LineString: '点击添加节点，双击结束绘制；Esc 取消当前绘制。', Polygon: '点击添加节点，双击闭合区域；Esc 取消当前绘制。', modify: '先选择要素，再拖动顶点调整形状。面积与长度为球面近似。' };
function tool(value: Tool) { app.setTool(value); updateTool(); }
function updateTool() { const current = app.getMode(); document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((button) => { button.classList.toggle('active', button.dataset.tool === current); button.setAttribute('aria-pressed', String(button.dataset.tool === current)); }); $('tool-hint').textContent = hints[current]; }
function refresh() {
 const features = app.source.getFeatures(); $('feature-count').textContent = `${features.length} 个要素`; $('features').replaceChildren();
 if (!features.length) $('features').textContent = '暂无要素，试试在地图上添加一个点。';
 for (const feature of features) { const button = document.createElement('button'); button.className = 'feature-item'; button.textContent = `${feature.getGeometry()?.getType() === 'Point' ? '●' : '◇'}  ${feature.get('name')}`; button.addEventListener('click', () => { app.choose(String(feature.getId())); updateTool(); }); $('features').append(button); }
 if (app.selected()) $('measure').textContent = app.measure(app.selected()!);
 updateTool();
}
let confirmed: (() => void) | null = null;
function confirm(title: string, run: () => void) { $('confirm-title').textContent = title; confirmed = run; $<HTMLDialogElement>('confirm').showModal(); }
$('cancel').addEventListener('click', () => $<HTMLDialogElement>('confirm').close()); $('confirm-go').addEventListener('click', () => { $<HTMLDialogElement>('confirm').close(); confirmed?.(); confirmed = null; });
document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((button) => button.addEventListener('click', () => tool(button.dataset.tool as Tool)));
$('fit').addEventListener('click', app.fit); $('online').addEventListener('change', () => { const enabled = $<HTMLInputElement>('online').checked; app.toggleOnline(enabled); $('basemap-mode').textContent = enabled ? 'OpenStreetMap' : '离线底图'; });
$('rename').addEventListener('click', () => { const name = $<HTMLInputElement>('feature-name').value.trim(); if (!name || name.length > 80) { message('名称应为 1–80 个字符', true); return; } app.selected()?.set('name', name); message('名称已更新。'); });
$('delete').addEventListener('click', () => { app.removeSelected(); message('要素已删除。'); });
$('reset').addEventListener('click', () => confirm('恢复示例数据？', () => { app.reset(); message('已恢复三个示例标注。'); }));
$('clear').addEventListener('click', () => confirm('清空当前图层？', () => { app.clear(); refresh(); message('图层已清空。'); }));
$('export').addEventListener('click', () => { try { const data = app.exportData(); const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/geo+json' })); const a = document.createElement('a'); a.href = url; a.download = 'map-lab.geojson'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); message(`已导出 ${data.features.length} 个要素，坐标为 WGS84。`); } catch (error) { message((error as Error).message, true); } });
$('import').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', async () => { const file = $<HTMLInputElement>('file').files?.[0]; if (!file) return; try { if (file.size > 1024 * 1024) throw new Error('导入文件不能超过 1MB'); const data = validateCollection(JSON.parse(await file.text())); confirm(`导入 ${data.features.length} 个要素并替换当前图层？`, () => { app.replace(data); message('导入成功；显示投影已转换为 EPSG:3857。'); }); } catch (error) { message(`导入失败：${(error as Error).message}`, true); } finally { $<HTMLInputElement>('file').value = ''; } });
window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !$<HTMLDialogElement>('confirm').open) tool('select'); });
new ResizeObserver(() => app.map.updateSize()).observe($('map'));
