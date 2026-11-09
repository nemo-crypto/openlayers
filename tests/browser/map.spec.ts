import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('离线地图支持标注、重命名、导出和导入', async ({ page }, info) => {
 const errors: string[] = []; const external: string[] = [];
 page.on('pageerror', error => errors.push(error.message));
 page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:5181') && request.url().startsWith('http')) external.push(request.url()); });
 await page.goto('/'); await expect(page.locator('#feature-count')).toHaveText('3 个要素');
 await page.getByRole('button', { name: /标注点/ }).click(); await page.locator('#map').click({ position: { x: 130, y: 130 } });
 await expect(page.locator('#feature-count')).toHaveText('4 个要素');
 await page.getByRole('button', { name: /标注 4/ }).click();
 // 跨过 OpenLayers 延迟 singleclick 的 250ms 窗口，验证选择不会被旧事件清除。
 await page.waitForTimeout(350);
 await expect(page.locator('#inspector')).toBeVisible();
 await page.getByLabel('要素名称').fill('我的教学标注'); await page.getByRole('button', { name: '保存名称' }).click();
 await expect(page.locator('#features')).toContainText('我的教学标注');
 const downloadEvent = page.waitForEvent('download'); await page.getByRole('button', { name: /导出 GeoJSON/ }).click(); const download = await downloadEvent;
 const target = info.outputPath('export.geojson'); await download.saveAs(target); const data = JSON.parse(await readFile(target, 'utf8')); expect(data.features).toHaveLength(4); expect(Math.abs(data.features[3].geometry.coordinates[0])).toBeLessThan(180);
 await page.getByRole('button', { name: '清空图层' }).click(); await page.getByRole('button', { name: '确认', exact: true }).click(); await expect(page.locator('#feature-count')).toHaveText('0 个要素');
 await page.locator('#file').setInputFiles(target); await page.getByRole('button', { name: '确认', exact: true }).click(); await expect(page.locator('#feature-count')).toHaveText('4 个要素');
 await expect.poll(() => page.locator('#map').evaluate((element) => Array.from(element.querySelectorAll('canvas')).some((canvas) => { const context = canvas.getContext('2d'); if (!context) return false; const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data; for (let index = 3; index < pixels.length; index += 400) if (pixels[index]! > 0) return true; return false; }))).toBe(true);
 await page.screenshot({ path: info.outputPath('map-lab.png'), fullPage: true });
 expect(errors).toEqual([]); expect(external).toEqual([]);
});
test('非法 GeoJSON 不覆盖当前数据，移动端无横向溢出', async ({ page }) => {
 await page.goto('/'); await expect(page.locator('#feature-count')).toHaveText('3 个要素');
 await page.locator('#file').setInputFiles({ name: 'bad.geojson', mimeType: 'application/json', buffer: Buffer.from('{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[0,90]}}]}') });
 await expect(page.locator('#message')).toContainText('导入失败'); await expect(page.locator('#feature-count')).toHaveText('3 个要素');
 for (const width of [360, 768, 1440]) { await page.setViewportSize({ width, height: 1000 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
});

test('线与面可绘制并以 WGS84 导出', async ({ page }, info) => {
 await page.goto('/'); await expect(page.locator('#feature-count')).toHaveText('3 个要素');
 const map = page.locator('#map');
 await page.getByRole('button', { name: /绘制线/ }).click();
 await map.click({ position: { x: 90, y: 160 } }); await map.click({ position: { x: 180, y: 180 } }); await map.dblclick({ position: { x: 220, y: 260 } });
 await expect(page.locator('#feature-count')).toHaveText('4 个要素');
 await page.getByRole('button', { name: /绘制面/ }).click();
 await map.click({ position: { x: 100, y: 200 } }); await map.click({ position: { x: 250, y: 200 } }); await map.click({ position: { x: 250, y: 320 } }); await map.dblclick({ position: { x: 100, y: 320 } });
 await expect(page.locator('#feature-count')).toHaveText('5 个要素');
 const pending = page.waitForEvent('download'); await page.getByRole('button', { name: /导出 GeoJSON/ }).click(); const file = await pending; const path = info.outputPath('shapes.geojson'); await file.saveAs(path);
 const data = JSON.parse(await readFile(path, 'utf8')); expect(data.features.map((f: { geometry: { type: string } }) => f.geometry.type)).toContain('LineString'); expect(data.features.map((f: { geometry: { type: string } }) => f.geometry.type)).toContain('Polygon');
});
