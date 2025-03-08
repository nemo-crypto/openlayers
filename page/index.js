
window.onload = function () {

    //按钮初始化
    $("input:radio[value='0']").attr('checked','checked');

    //初始化地图中心坐标--故宫博物馆
    let beijing = ol.proj.fromLonLat([116.39630783081054, 39.919226074218756]);

    //数据源
    let gaodeMapLayer = new ol.layer.Tile({
        source: new ol.source.XYZ({
            /*在线高德数据源*/
            url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}'
        })
    });

    //初始化地图  16-10 17-20 18-40 19-80 20-160
    let map = new ol.Map({
        target: 'map',
        layers: [gaodeMapLayer],
        view: new ol.View({
            center: beijing,
            zoom: 12,     //初始化地图的层级
            minZoom:11,  //设置地图最小层级
            maxZoom:18  //设置地图最大层级
        })
    });

    //添加属性控件
    // map.addControl(new ol.control.Attribution());
    //添加鼠标定位控件
    map.addControl(new ol.control.MousePosition({
            undefinedHTML: 'outside',
            projection: 'EPSG:4326',
            coordinateFormat: function(coordinate) {
                return ol.coordinate.format(coordinate, '{x}, {y}', 4);
            }
        })
    );
    //添加缩略图控件
    // map.addControl(new ol.control.OverviewMap({
    //     collapsed: false
    // }));
    //添加旋转控件
    map.addControl(new ol.control.Rotate({
        autoHide: true
    }));
    //添加比例尺控件
    map.addControl(new ol.control.ScaleLine());
    //添加缩放控件
    map.addControl(new ol.control.Zoom());
    //添加缩放滑动控件
    map.addControl(new ol.control.ZoomSlider());
    //添加缩放到当前视图滑动控件
    map.addControl(new ol.control.ZoomToExtent());
    //添加全屏控件
    map.addControl(new ol.control.FullScreen());




    //创建自定义标签的样式
    let createLabelStyle = function (feature) {
        //返回一个样式
        return new ol.style.Style({
            // stroke: new ol.style.Stroke({ //边界样式
            //     lineDash:[6],//注意:该属性为虚线效果，在IE10以上版本才有效果
            //     color:'#ff1013',
            //     width: 2
            // }),
            //把点的样式换成ICON图标
            image: new ol.style.Icon({
                //控制标注图片和文字之间的距离
                anchor: [0.5, 30],
                //标注样式的起点位置
                anchorOrigin: 'top-right',
                //X方向单位：分数
                anchorXUnits: 'fraction',
                //Y方向单位：像素
                anchorYUnits: 'pixels',
                //偏移起点位置的方向
                offsetOrigin: 'top-right',
                //透明度
                opacity: 0.75,
                //图片路径
                src: 'images/icon_.png'
            }),
            //文本样式
            text: new ol.style.Text({
                //对齐方式
                textAlign: 'center',
                //文本基线
                textBaseline: 'middle',
                //字体样式
                font: 'normal 14px 微软雅黑',
                //文本内容
                text: feature.values_.name,
                //填充样式
                fill: new ol.style.Fill({
                    color: '#ff1a23'
                }),
                //笔触
                // stroke: new ol.style.Stroke({
                //     color: '#ffc211',
                //     width: 2
                // })
            })
        });
    };

    /*测试假数据--后台返回数据格式*/
    let orgData = [
        {
            name:'北京银行',
            id:'11111099',
            points:[116.34585,39.906728]
        },
        {
            name:'汇丰银行',
            id:'11111098',
            points:[116.290427,39.958342]
        },
        {
            name:'工商银行',
            id:'11111097',
            points:[116.368068,39.941123]
        },
        {
            name:'农业银行',
            id:'11111096',
            points:[116.324926,39.992853]
        },
        {
            name:'民生银行',
            id:'11111095',
            points:[116.440219,39.909172]
        },
        {
            name:'中国银行',
            id:'11111094',
            points:[116.612204,39.924258]
        },
        {
            name:'建设银行',
            id:'11111093',
            points:[116.160485,39.92871]
        },
    ];

    /*创建--标注物*/
    for(let i = 0; i < orgData.length; i++) {
        //标注物-坐标转化
        let point = ol.proj.fromLonLat(orgData[i].points);

        //初始化要素
        let iconFeature = new ol.Feature({
            //点要素
            geometry: new ol.geom.Point(point),
            //名称属性
            name: orgData[i].name,
            //挂载其他参数
            data: orgData[i]
        });
        //为点要素添加样式
        iconFeature.setStyle(createLabelStyle(iconFeature));

        //初始化矢量数据源
        let vectorSource = new ol.source.Vector({
            //指定要素
            features:[iconFeature]
        });

        //初始化矢量图层
        let vectorLayer = new ol.layer.Vector({
            //数据源
            source:vectorSource
        });

        //将矢量图层添加到map中
        map.addLayer(vectorLayer);

        /**************覆盖层--start************/

        let markerId = 'marker_' +i;
        let	newAddHTML = '<div id="'+ markerId +'"  class="marker" title="'+ orgData[i].name+'">'+
                            '<div class="pulse"></div>'+
                            '<div class="pulse1"></div>'+
                         '</div>';

        let $newAddImgs = $( newAddHTML );
        $('#label').append( $newAddImgs );


        //初始化覆盖层标注
        let marker = new ol.Overlay({
                //位置坐标
                position: point,
                //覆盖层如何与位置坐标匹配
                positioning: 'center-center',
                //覆盖层的元素
                element: document.getElementById(markerId),//ToDo 此处不能用JQuery方式$('#marker')获取元素
                //事件传播到地图视点的时候是否应该停止
                stopEvent:false
            });
        //将覆盖层添加到map中
        map.addOverlay(marker);
        /**************--end************/

    }

    //监听地图缩放级别事件moveend
    map.on('moveend',function(e){
        let zoom = map.getView().getZoom();  //获取当前地图的缩放级别
        console.log('当前地图的层级'+zoom);
        if( zoom < 16 ) {

            // vectorLayer.getSource().getFeatures().forEach(function(item){
            //     console.log(item);
            // });



            // let a = vectorLayer;
            // let b = vectorSource;
            // let c = iconFeature;
            // // console.log('vectorLayer'+vectorLayer);
            // // console.log('vectorSource'+vectorSource);
            // // console.log('iconFeature'+iconFeature);
            //
            //
            // // console.log(vectorLayer);
            // // //清除标注物数据源中的所有元素
            // vectorLayer.getSource().clear();
            // // //清除所有标注物图层
            // // map.removeLayer(vectorLayer);
        }


    });

    //地图的点击事件
    map.on('click', function (evt) {
        //获取点击当前坐标的时间
        let curDate = new Date();
        let onoverTime = curDate.toLocaleTimeString();
        let feature = map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
            return feature;
        });
        let clickPoint = evt.coordinate;
        if (feature) {
            let layName = feature.values_.name;
            layer.open({
                type: 1
                ,title: layName //不显示标题栏
                ,closeBtn: false
                ,area: '300px;'
                ,shade: 0.3
                ,id: 'LAY_layuipro' //设定一个id，防止重复弹出
                ,resize: false
                ,content: '<div style="padding: 50px; line-height: 22px; background-color: #596e89; color: #fff; font-weight: 300;">' +
                                '内容<br>内容<br>' + onoverTime+
                          '</div>'
                ,btn: '关闭'
                ,btnAlign: 'r'
                ,moveType: 1 //拖拽模式，0或者1
                ,yes: function(){
                    layer.closeAll();
                }
            });
        }else {
            //没有标注物的地方点击出发增加标注物function
            let type = $('.type input[name="addAnddel"]:checked').val();
            if(type == '0') {
                //无操作
            }else if( type == '1'){
                //+标注物
                addVectorLabel(clickPoint);
            }else if( type == '-1'){
                //-标注物

            }

        }



    });

    //添加矢量标签
    function addVectorLabel(coordinate) {
        //初始化一个新的点要素
        let newFeature = new ol.Feature({
            geometry: new ol.geom.Point(coordinate),
            name: '标注点'
        });
        //设置点的样式
        newFeature.setStyle(createLabelStyle(newFeature));
        //将当前要素添加到矢量数据源中
        vectorSource.addFeature(newFeature);
    }

    //添加覆盖标注
    function addOverlayLabel(coordinate) {
        //创建一个div元素
        let elementDiv = document.createElement('div');
        //设置div元素的样式类
        elementDiv.className = 'marker';
        //设置div元素的title属性
        elementDiv.title = '标注点';

        //获取id为label的div标签
        let overlay = document.getElementById('label');
        //将新创建的div标签添加到overlay中
        overlay.appendChild(elementDiv);

        //创建一个a标签元素
        let elementA = document.createElement('a');
        //设置a标签的样式类
        elementA.className = 'address';
        //设置a标签的链接地址
        elementA.href = '#';
        //设置a标签的超链接文本
        setInnerText(elementA, elementDiv.title);
        //将a标签元素添加到div标签元素中
        elementDiv.appendChild(elementA);

        //新建一个覆盖层
        let newMarker = new ol.Overlay({
            //设置位置为当前鼠标点击的坐标
            position: coordinate,
            //设置覆盖层与位置之间的匹配方式
            positioning: 'center-center',
            //覆盖层元素
            element: elementDiv,
            //事件传播到地图视点的时候是否应该停止
            stopEvent:false
        });
        //将覆盖层添加到map中
        map.addOverlay(newMarker);

        //新建一个文本覆盖层
        let newText = new ol.Overlay({
            //设置位置为当前鼠标点击的坐标
            position: coordinate,
            //覆盖层元素
            element:elementA
        });
        //将文本覆盖层添加到map中
        map.addOverlay(newText);
    }

    //设置文本内容
    function setInnerText(element,text) {
        if (typeof element.textContent == 'string') {
            element.textContent = text;
        } else {
            element.innerText = text;
        }
    }
};
