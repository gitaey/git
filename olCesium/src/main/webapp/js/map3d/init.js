// var sis = null;
var sis, sis3d, sisDraw3d, sisLayer3d = null;
var sisSearch;
var map3dDual = null;

// 레이어 목록
var boundary = null; // 행정구역
var jijuk = null; // 지적도

// 항공영상
var airphoto2019 = null;
var airphoto2021 = null;
var airphoto2022 = null;

$(window).on("load", function () {

    // 2D Map Init
    sis = new SisMap("map", {
        baseMap: true
    });

    // 3D Map Init
    sis3d = new Sis3D(sis.map, {});

    createAirphoto = (item) => {
        let projection;
        let resolutions;
        let extent;
        let origin;
        var matrixIds, matrixSet;

        matrixIds = [
            `EPSG:5181_test:0`,
            `EPSG:5181_test:1`,
            `EPSG:5181_test:2`,
            `EPSG:5181_test:3`,
            `EPSG:5181_test:4`,
            `EPSG:5181_test:5`,
            `EPSG:5181_test:6`,
            `EPSG:5181_test:7`,
            `EPSG:5181_test:8`,
            `EPSG:5181_test:9`,
            `EPSG:5181_test:10`,
            `EPSG:5181_test:11`,
            `EPSG:5181_test:12`,
        ];

        matrixSet = 'EPSG:5181_test';

        projection = new ol.proj.Projection({
            code: 'EPSG:3857',
        });

        extent = [-5423200.0, 194964.06739480048, 250,629.48099229578, 6294600.0];
        resolutions = [529.1677250021168, 264.5838625010584, 132.2919312505292, 66.1459656252646,
            33.0729828126323, 16.933367200067735, 8.466683600033868, 4.233341800016934, 2.116670900008467,
            1.0583354500042335, 0.5291677250021167, 0.2645838625010584, 0.1322919312505292];
        origin = [-5423200.0, 6294600.0];

        lyr = new ol.layer.Tile({
            id: "test",
            source: new ol.source.WMTS({
                // url: `/gwc/service/wmts`,
                // url: "/map/proxy/proxyBackgroundByUrl.do",
                url: "http://sisnet.iptime.org:9002/gwc/service/wmts",
                layer: "test",
                matrixSet: 'EPSG:5181_test',
                format: "image/png",
                projection: "EPSG:3857",
                tileGrid: new ol.tilegrid.WMTS({
                    tileSize: [256,256],
                    extent: [-5423200.0,63120.870375073515,266411.37922275905,6294600.0],
                    origin: [-5423200.0, 6294600.0],
                    resolutions: [529.1677250021168, 264.5838625010584, 132.2919312505292, 66.1459656252646, 33.0729828126323, 16.933367200067735, 8.466683600033868, 4.233341800016934, 2.116670900008467, 1.0583354500042335, 0.5291677250021167, 0.26458386250105836, 0.13229193125052918],
                    matrixIds: ['EPSG:5181_test:0', 'EPSG:5181_test:1', 'EPSG:5181_test:2', 'EPSG:5181_test:3', 'EPSG:5181_test:4', 'EPSG:5181_test:5', 'EPSG:5181_test:6', 'EPSG:5181_test:7', 'EPSG:5181_test:8', 'EPSG:5181_test:9', 'EPSG:5181_test:10', 'EPSG:5181_test:11', 'EPSG:5181_test:12']
                }),
                imageSmoothing: false,
                // wrapX: true,
            }),
            visible: true,
        });

        sis.map.addLayer(lyr);
    };

    // createAirphoto();























    return;

    // 3D Draw
    sisDraw3d = new Sis3DDraw(sis3d);

    // 3D Layer
    sisLayer3d = new Sis3DLayer(sis3d);

    // 검색
    sisSearch = new SearchAddr({
        keywordID: "keyword",
        resultID: "itemsWrap",
        countID: "count"
    });

    //
    $("#mapMenuWrap .btn").on("click", (e) => {
        var isActive = $(e.target).closest(".btn").hasClass("active");

        // 팝업안에 메뉴클릭했을때
        if ($(e.target).closest(".menuPop").length) return;

        $("#mapMenuWrap .btn").removeClass("active");
        $("#mapMenuWrap .menuPop").hide();

        if (!isActive) {
            $(e.target).closest(".btn").toggleClass("active");
            $(e.target).closest(".btn").find(".menuPop").toggle();
        }

        // 건물정보 버튼 클릭했을 때
        var target = e.target instanceof SVGPathElement ? e.target.parentElement : e.target;
        if ($(target).hasClass("buld-info") && $(target).closest(".btn").hasClass("active")) {
            sisLayer3d.infoCondition = true;
        } else {
            sisLayer3d.infoCondition = false;
        }
    });

    // 드론 3D영상 추가/삭제
    $("input[type=checkbox][name=drone]").on("click", function (e) {
        var drone = sisLayer3d.loadPrim[e.target.value + "_drone"];;

        if ($(e.target).prop("checked")) {
            if(!drone) {
                sisLayer3d.addDroneModel(e.target.value);
                sisLayer3d.addBuldFromAsset(e.target.value, 1682965);
            }
            else {
                drone.show = true;
            }
        } else {
            drone.show = false;

            // 모달창 숨김김
            $("#info-modal").hide();
        }
    });

    $("#keyword").on("keyup", (evt) => {
        if(evt.key == "Enter") {
            sisSearch.searchName(1);
            $("#searchResultWrap").show();
        }
    });

    // 주소검색
    $("#btnSearch").on("click", () => {
        sisSearch.searchName(1);
        $("#searchResultWrap").show();
    });

    $("#btnSearchClose").on("click", () => {
        $("#searchResultWrap").hide();
    });

    // 거리측정
    $("#calDis").on("click", function (e) {
        if ($("#calDis").hasClass("active")) {
            sisDraw3d.stopDraw();
        } else {
            sisDraw3d.startDraw("line", true);

            $("#calDis").addClass("active")
        }
    });

    // 표고측정
    $("#calHeight").on("click", function (e) {
        if ($("#calHeight").hasClass("active")) {
            sisDraw3d.stopDraw();
        } else {
            sisDraw3d.getHeight("height", true);

            $("#calHeight").addClass("active");
        }
    });

    // 면적측정
    $("#calArea").on("click", function () {
        if ($("#calArea").hasClass("active")) {
            sisDraw3d.stopDraw();
        } else {
            sisDraw3d.startDraw("polygon", true);

            $("#calArea").addClass("active");
        }
    });

    // 맵 초기화
    $("#clearMap").on("click", function () {
        sisDraw3d.clearDraw();
        sisDraw3d.stopDraw();
        sisSearch.dataSources.entities.removeAll();
    });


    // 배경지도 변경
    $("input[name=baseMap]").on("change", (e) => {
        var id = e.target.id;

        if(id == "vworldMap" || id == "hybridMap") {
            sis3d.changeBaseMap(id);
        } else {

        }
    });

    // 3D 건물
    $("input[name=uild3d]").on("change", (e) => {
        var id = e.target.id;

        if (id == 'build3dOn') {

        }
    });

    $(".menuPop .menuWrap").on("click", (e) => {
        var target = $(e.target).closest(".menuWrap");
        target.toggleClass("active");

        var id = target.attr("id");
        var visible = target.hasClass("active");

        if (id == "lsmd_adm_sect_sgg_jn") {
            boundary.show = visible;
        }

        if (id == "lsmd_cont_ldreg") {
            jijuk.show = visible;
        }
    });

    // 항공영상 추가
    // airphoto2019 = addWmtsLayer("airphoto2019", false);
    // airphoto2021 = addWmtsLayer("airphoto2021_new", false);
    airphoto2022 = addWmtsLayer("test", true);

    // 레이어 추가
    boundary = addWmsLayer("lsmd_adm_sect_sgg_jn", false);
    jijuk = addWmsLayer("lsmd_cont_ldreg", true);

    // 나침반 클릭
    // var obj = document.querySelector("#compassObj");
    // var compassSvg = obj.contentDocument.querySelector("svg")
    // $(compassSvg).on("click", function(e) {
    //     sis.map.getView().setRotation(0);
    // });

    // Modal Draggable
    $("#info-modal").draggable({
        cancel: ".modal-body, .modal-footer",
        containment: 'parent'
    });

    // Modal Hide
    $(".modal-close-btn").on("click", function (e) {
        sisLayer3d.removePickedFeatureColor();
        $("#info-modal").hide();
    });

    // 화면 저장
    $("#saveScreen").on("click", function (e) {
        sis3d.viewer.render();
        html2canvas(document.querySelector("#map"), {
            allowTaint: false,
            useCORS: true,
        }).then(function (canvas) {
            var image = canvas.toDataURL('image/png', 1.0);
            downloadURI(image, "화면저장.png");
        })
    });

    // 화면 공유
    // $("#shareScreen").on("click", function (e) {
    //     prompt("Ctrl + C 버튼을 눌러 복사하세요.",
    //         'http://localhost:8081/mapMain.do?share=Y'
    //         + '&lon=' + sis3d.centerPosition.lon
    //         + '&lat=' + sis3d.centerPosition.lat
    //         + '&height=' + sis3d.centerPosition.height
    //         + '&pitch=' + sis3d.centerPosition.pitch
    //         + '&roll=' + sis3d.centerPosition.roll
    //         + '&height=' + sis3d.centerPosition.height
    //     );
    // });

    // Zoom In
    $("#zoomIn").on("click", function () {
        sis3d.zoomIn();
    });

    $("#zoomOut").on("click", function () {
        sis3d.zoomOut();
    });

    test();
});

async function test() {

    const resource = new Cesium.Resource({
        url: "/map/getTopojson.do",
        queryParameters: {
            target: 'or3d'
        }
    })

    const dataSource = await Cesium.GeoJsonDataSource.load(resource).then(function (item) {
        var entities = [];

        item.entities.values.forEach(function (entity, idx) {
            var polygon = entity.polygon;
            var hierarchy = polygon.hierarchy.getValue();
            var positions = hierarchy.positions;

            var coords = [];
            var arrTmp = [];

            if (positions.length > 0) {
                for (var i = 0; i < positions.length; i++) {
                    var coord = sis3d.scene.globe.ellipsoid.cartesianToCartographic(positions[i]);

                    arrTmp.push([coord.longitude * (180 / Math.PI), coord.latitude * (180 / Math.PI)]);
                }

                var coord = sis3d.scene.globe.ellipsoid.cartesianToCartographic(positions[0]);
                arrTmp.push([coord.longitude * (180 / Math.PI), coord.latitude * (180 / Math.PI)]);
                coords.push(arrTmp);

                polygon = turf.polygon(coords);

                var area = turf.area(polygon);
                var units = "㎡";
                if (area >= 1000000) {
                    area = area / 1000000;
                    units = "㎢";
                }
                area = area.toFixed(2).toString();
                area = numberWithCommas(area) + " " + units;

                var centerCoords = turf.pointOnFeature(polygon).geometry.coordinates;
                var center = Cesium.Cartesian3.fromDegrees(centerCoords[0], centerCoords[1]);
                var cthPos = sis3d.scene.clampToHeight(center);

                var pos = center;

                if (cthPos) pos = cthPos;

                let ent = sis3d.viewer.entities.add({
                    polyline: {
                        positions: entity.polygon.hierarchy.getValue().positions,
                        width: 1,
                        material: Cesium.Color.fromBytes(255, 158, 23, 255),
                        classificationType: Cesium.ClassificationType.CESIUM_3D_TILE,
                        clampToGround: true
                    },
                });
            }
        });
    });
}

function downloadURI(uri, name) {
    var anchor = document.createElement('a');
    anchor.setAttribute('href', uri); //path
    anchor.setAttribute('download', name); //file name
    document.body.appendChild(anchor);
    anchor.click(); //<a> tag click
    anchor.parentNode.removeChild(anchor);
}

function compassClickEvt() {
    sis3d.resetCamera();
}

function addWmtsLayer(name, show) {
    var epsg5181Rectangle = Cesium.Rectangle.fromDegrees(-142.8858704339545, 23.285299752866333, 127.71936052145797, 89.40542593804888);
    var epsg5181 = new Cesium.GeographicTilingScheme({
        rectangle: epsg5181Rectangle,
        numberOfLevelZeroTilesX: 2,
        numberOfLevelZeroTilesY: 8,
        // ellipsoid: ?,
    });

    const lyr = new Cesium.WebMapTileServiceImageryProvider({
        url : '/map/proxy/gwc.do',
        layer : name,
        style : '',
        format : 'image/png',
        tileMatrixSetID : "EPSG:5181_" + name,
        tileMatrixLabels : [
            "EPSG:5181_" + name + ":0",
            "EPSG:5181_" + name + ":1",
            "EPSG:5181_" + name + ":2",
            "EPSG:5181_" + name + ":3",
            "EPSG:5181_" + name + ":4",
            "EPSG:5181_" + name + ":5",
            "EPSG:5181_" + name + ":6",
            "EPSG:5181_" + name + ":7",
            "EPSG:5181_" + name + ":8",
            "EPSG:5181_" + name + ":9",
            "EPSG:5181_" + name + ":10",
            "EPSG:5181_" + name + ":11",
            "EPSG:5181_" + name + ":12"
        ],
        rectangle: Cesium.Rectangle.fromDegrees(-142.8858704339545, 23.285299752866333, 127.71936052145797, 89.40542593804888),
        tilingScheme: new Cesium.GeographicTilingScheme({
            numberOfLevelZeroTilesX: 3,
            numberOfLevelZeroTilesY:2,
        }),
        // maximumLevel: 19,
    });
    sis3d.scene.imageryLayers.addImageryProvider(lyr);

    return lyr;
}

function addWmsLayer(name, show) {
    var provider = new Cesium.WebMapServiceImageryProvider({
        // 제작한 국가지점번호 레이어 가져오기
        id: name,
        url: '/map/proxy/wms.do',
        parameters: {
            format: 'image/png',
            transparent: 'true',
            tiled: 'true',
            version: '1.3.0',
        },
        layers: name,
        visible: show
    });

    var lyr = new Cesium.ImageryLayer(provider);
    lyr.show = show;


    var imageryLayers = sis3d.scene.imageryLayers;

    imageryLayers.add(lyr);

    return lyr;
}

function removeWmsLayer(name) {
    if (name) {
        sis3d.scene.globe.imageryLayers._layers.forEach(function (item, idx) {
            if (item._url !== undefined && item._url.indexOf(name) > -1) {
                sis3d.scene.globe.imageryLayers.remove(sis3d.scene.globe.imageryLayers._layers[idx]);
            }
        });
    } else {
        sis3d.scene.globe.imageryLayers._layers.forEach(function (item, idx) {
            if (idx > 0) {
                sis3d.scene.globe.imageryLayers.remove(sis3d.scene.globe.imageryLayers._layers[idx]);
            }
        });
    }
}

(function (window, $) {
    /* Combobox 실행대기 후 실행 */
    $.waitForLazyRunners = function (callback) {
        var run = function () {
            if (!$.runner || $.runner <= 0) {
                clearInterval(interval);
                if (typeof callback === 'function') {
                    callback();
                }
            } else {
                //console.log("wait...");
            }
        };
        var interval = setInterval(run, 30);
    }
})(window, jQuery);