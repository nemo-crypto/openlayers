# OpenLayers 地图标注示例

基于浏览器原生HTML、jQuery和本地OpenLayers脚本的地图实验页面，包含地图控件、标注添加/移除及地图交互。此目录没有Node构建工程或后端服务。

## 目录与入口

| 路径 | 作用 |
|---|---|
| [page/index.html](page/index.html) | 地图容器、类型菜单与操作入口 |
| [page/index.js](page/index.js) | 地图初始化、图层、投影、控件和标注逻辑 |
| `page/index.css` | 页面与地图样式 |
| `page/lib/` | 现有OpenLayers、jQuery、Bootstrap和弹层资源 |

## 本地预览

在项目目录启动只监听本机的静态服务：

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8080/page/index.html`。无需npm install，也没有npm build/test脚本。

## 地图与坐标配置

初始化坐标和在线瓦片地址位于 `page/index.js`。页面通过 `ol.proj.fromLonLat` 将经纬度转换为地图投影，鼠标坐标显示使用EPSG:4326。地图初始缩放12，最小11、最大18。

瓦片请求依赖外部网络，源码当前使用HTTP瓦片地址；在HTTPS宿主中预览时需检查混合内容和服务可达性。坐标偏移应先核对数据坐标系、瓦片坐标系和转换流程，不能仅凭经纬度数值判断一致。

原记录提到通过高德坐标拾取器取点；拾取结果仍需结合所用数据源和坐标基准核实。

## 修改与验收

新增标注和交互集中维护在index.js，页面控件在index.html，样式放index.css。检查地图加载、缩放、坐标显示、标注添加/删除与控制台请求错误。

本轮只核对静态文件与地图初始化代码，未访问瓦片服务或执行浏览器验证；第三方库资源保持原样。
