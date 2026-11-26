import { test, expect } from '@playwright/test';

async function delayImports(page: import('@playwright/test').Page) {
 await page.addInitScript(() => {
  const original = File.prototype.text;
  (window as any).pendingImports = [];
  File.prototype.text = async function () {
   const contents = await original.call(this);
   return new Promise<string>(resolve => (window as any).pendingImports.push(() => resolve(contents)));
  };
 });
 await page.goto('/');
 await expect(page.locator('#feature-count')).toHaveText('3 个要素');
}
const file = (name: string) => ({ name: `${name}.geojson`, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', id: name, properties: { name }, geometry: { type: 'Point', coordinates: [121, 31] } }] })) });

test('a delayed import cannot replace the clear-layer confirmation already shown to the user', async ({ page }) => {
 await delayImports(page);
 await page.locator('#file').setInputFiles(file('old import'));
 await page.waitForFunction(() => (window as any).pendingImports.length === 1);
 await page.getByRole('button', { name: '清空图层' }).click();
 await page.evaluate(() => (window as any).pendingImports[0]());
 await expect(page.locator('#confirm-title')).toHaveText('清空当前图层？');
 await page.getByRole('button', { name: '确认', exact: true }).click();
 await expect(page.locator('#feature-count')).toHaveText('0 个要素');
});
