# Map Lab · OpenLayers 地图交互教学版

使用 **OpenLayers 10 + TypeScript + Vite** 从零搭建交互地图实验室。学习图层、要素、坐标投影、绘制、选择、编辑和 GeoJSON 数据往返。旧 page 目录及第三方脚本副本已移除，当前示例不依赖旧业务代码。

<!-- BEGIN project-discovery -->
## 项目定位与实践入口

OpenLayers 10 + TypeScript Web GIS tutorial with offline maps, drawing, editing, measurement and GeoJSON import/export. 交互地图教学 Demo，支持移动端与 Playwright 测试。

适合从以下入口阅读实现与接入条件：

- [图层与地图交互](src/map.ts)
- [GeoJSON 校验](src/geojson.ts)
- [地图实践课程](docs/learning-path.md)
<!-- END project-discovery -->

## 快速开始

Node.js 22.12+，推荐 Node 24。

```sh
npm ci
npm run dev
```

打开终端显示的本地地址（默认 http://127.0.0.1:5173）。默认使用自行生成的园区示意底图，无外部地图请求、无需 Key。示意建筑和道路不代表真实地理位置。

## 可以动手完成的功能

- 新增点标注，绘制线和面；双击结束绘制，Esc 取消当前绘制。
- 从地图或列表选择要素，修改名称、删除要素、编辑顶点。
- 自动适配视图，查看经纬度、球面近似长度与面积。
- 导出 WGS84 GeoJSON；校验后导入并替换当前图层。
- 恢复示例或清空图层前显式确认。
- 主动开启 OpenStreetMap 在线底图，保留署名；加载失败时可切回离线示意图。

## 工程结构

```text
src/map.ts        地图、图层、交互与投影转换
src/geojson.ts    数据契约、输入校验和独立示例
src/main.ts       UI 事件、状态反馈、文件操作
src/style.css     桌面 / 平板 / 手机布局
tests/            数据规则和真实浏览器操作测试
docs/             架构和实践课程
```

## 验证命令

```sh
npm test                       # 数据校验单元测试
npm run build                  # 类型检查与生产构建
npx playwright install chromium
npm run test:e2e                # 先 build；桌面和移动模拟
npm run preview                # 预览生产构建
```

端到端测试使用生产构建，验证点线面绘制、名称修改、GeoJSON 导入导出、非法文件保护与响应式布局。测试默认不请求外部瓦片。

## 坐标与使用边界

显示投影为 EPSG:3857，输入输出为 WGS84 经纬度（EPSG:4326）。本项目不包含 GCJ-02/BD-09 偏移转换，不可把其他坐标系数据直接当 WGS84 导入。纬度限制为 Web Mercator 可显示范围 ±85.05112878°。

仅支持 Point、LineString、Polygon；导入文件最多 1MB、200 个要素、10000 个顶点。导出会应用同样的要素/顶点校验。无自动持久化，刷新前需导出；名称保留，其他属性不会被导入传播。当前校验不覆盖自相交、多环拓扑、日期变更线或专业测绘精度。

在线 OpenStreetMap 会向提供方请求瓦片，需遵守其署名和服务使用政策；离线示意模式不需要外部服务。本 Demo 没有定位权限请求或后台位置采集。

阅读：[架构设计](docs/architecture.md) · [五节实践课](docs/learning-path.md)。旧代码可能仍存在 Git 历史中，本次没有改写历史或推送。
