(function (window, $) {
    "use strict";

    window.SisMap = function (mapId, props) {
        this.mapId = mapId;
        this._init(mapId, props);
    };

    SisMap.prototype = {
        mapId: "",
        map: null,
        view: null,
        subMap: [], // 화면분할 맵

        // 다음지도
        daumMap: null,
        satellite: null,
        hybridMap: null,

        // 구글지도
        googleHybridMap: null,
        googleLayerMap: null,

        // 브이월드
        vMap: null,
        vSatellite: null,
        vHybrid: null,

        // 로드뷰 관련
        mapWalker: null,
        roadViewTarget: null,
        prePosition: null,
        sisRoadViewOverlay: null,

        props: {
            crsCode: "EPSG:3857",
            geoserverCrsCode: "EPSG:5181",
            maxZoom: 19,
            minZoom: 0,
            zoom: 5,
            center: [14080424.619709337, 4137865.1255640355] //지도 센터 좌표
        },

        /**
         * 초기설정
         * @date 2022.06.17
         * @param mapId 지도 엘리먼트 아이디
         * @param props
         * */
        _init: function (mapId, props) {
            if (!mapId) {
                alert("지도ID를 지정하여 주세요");
                return false;
            }

            this.extendProps(props);
            this._setProj4(); // 좌표계 설정
            this._createMap(); // 지도 생성

            if (this.props.baseMap) this._addVWorld(true); // 베이스맵 불러오기

            // this._addDaum(true);

        },

        /**
         * 기존 속성값 Extend
         * @date 2022.06.17
         * @param props
         * */
        extendProps: function (props) {
            this.props = $.extend({}, this.props, props);
        },

        /**
         * 좌표계 등록
         * @date 2022.06.17
         * */
        _setProj4: function () {
            proj4.defs("EPSG:5181", "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
            proj4.defs("EPSG:5186", "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs");
            proj4.defs("EPSG:5179", "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

            ol.proj.proj4.register(proj4);
        },

        /**
         * 지도 센터 이동
         * @date 2022.06.17
         * @param coord Array ex) [127, 36]
         * @param coordEpsg coord EPSG 코드
         * @param zoom 센터 이동 후 줌변경 (기본값 10)
         * */
        setCenter: function (coord, coordEpsg, zoom) {
            if (!zoom) zoom = 10;
            this.view.setCenter(ol.proj.transform(coord, coordEpsg, this.props.crsCode));
            this.view.setZoom(zoom);
        },

        /**
         * 화면분할 맵 초기화
         * @date 2022.06.17
         * */
        subMapClear: function () {
            var layers;
            var ele;

            this.subMap.forEach(function (map) {
                layers = map.getLayers();

                layers.forEach(function (lyr) {
                    map.removeLayer(lyr);
                });

                ele = map.getTargetElement();
                $(ele).find(".ol-viewport").remove();
                map.setTarget(undefined);
            });

            this.subMap = [];
            $(".sisSubMap").hide();
            $("#" + this.mapId).removeClass("split");
            $("#" + this.mapId + ", .sisSubMap").removeClass("h50");
            this.map.updateSize();
        },

        /**
         * 화면분할 맵 생성
         * @date 2022.06.17
         * @param cnt 분할 맵 개수
         * */
        createSubMap: function (cnt) {
            if (!cnt) cnt = 2;

            var self = this;
            this.isSplit = true;
            this.subMapClear();

            $("#" + this.mapId).addClass("split");
            if (cnt > 2) {
                $("#" + this.mapId).addClass("h50");
                $(".sisSubMap").addClass("h50");
            }
            this.map.updateSize();

            var layers = this.map.getLayers();

            var idx = 0;
            for (var j = 2; j <= cnt; j++) {
                $("#subMap" + j).css({display: "inline-block"});

                idx = j - 2;

                this.subMap[idx] = new ol.Map({
                    target: "subMap" + j,
                    renderer: 'canvas',
                    controls: ol.control.defaults({
                        attribution: false,
                        collapsible: false,
                        zoom: false,
                        rotate: false,
                    }),
                    interactions: ol.interaction.defaults({
                        dragPan: false,
                        mouseWheelZoom: false,
                    }).extend([
                        new ol.interaction.DragPan({
                            kinetic: false,
                        }),
                        new ol.interaction.MouseWheelZoom({
                            duration: 0,
                        }),
                        new ol.interaction.DoubleClickZoom({
                            duration: 0,
                        }),
                    ]),
                    view: this.map.getView(),
                });

                var vMaps = this._addVWorld(true, this.subMap[idx]);

                layers.forEach(function (lyr) {
                    var source = lyr.getSource();

                    if (lyr instanceof ol.layer.Tile) {
                        if (source instanceof ol.source.XYZ) {
                            if(lyr.get("id") == vMaps.vMap.get("id")) vMaps.vMap.setVisible(lyr.getVisible());
                            else if(lyr.get("id") == vMaps.vHybrid.get("id")) vMaps.vHybrid.setVisible(lyr.getVisible());
                            else if(lyr.get("id") == vMaps.vSatellite.get("id")) vMaps.vSatellite.setVisible(lyr.getVisible());
                        }
                    } else if (lyr instanceof ol.layer.Vector) {
                        var layer = new ol.layer.Vector(lyr.getProperties());
                        layer.setZIndex(lyr.getZIndex());
                        layer.setStyle(lyr.getStyle());
                        self.subMap[idx].addLayer(layer);
                    }
                });

                // overlays.forEach((lyr) => {
                // 	self.subMap[idx].addOverlay(new Overlay(lyr.getProperties()));
                // });
            }
        },

        /**
         * 지도 맵 생성
         * @date 2022.06.17
         * */
        _createMap: function () {
            this.map = new ol.Map({
                target: this.mapId,
                renderer: 'canvas',
                controls: ol.control.defaults({
                    attribution: false,
                    collapsible: false,
                    zoom: true
                }).extend([]),
                view: new ol.View(),
                interactions: ol.interaction.defaults({
                    dragPan: false,
                    doubleClickZoom: false,
                    mouseWheelZoom: false
                }).extend([new ol.interaction.DragPan({
                    kinetic: false
                }), new ol.interaction.MouseWheelZoom({
                    duration: 0
                })])
            });

            this.changeBaseMap("vworld");
            this.view = this.map.getView();

            this.map.getViewport().addEventListener("contextmenu", function (e) {
                e.preventDefault();
            });

            this.map.on("pointermove", function (evt) {
                var hit = this.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                    if(feature.getId() != "searchBoundary")
                        return true;
                    else
                        return false;
                });
                if (hit) {
                    this.getTargetElement().style.cursor = 'pointer';
                } else {
                    this.getTargetElement().style.cursor = '';
                }
            });
        },

        /**
         * 지도 배경맵 변경
         * @date 2022.06.17
         * @param id 배경지도 ID (daum, google, vworld)
         * */
        changeBaseMap: function (id) {
            if (!id) return;
            if (!this.preBaseMap) {
                this.preBaseMap = id.toLowerCase();
            } else {
                if (this.preBaseMap == id) return;
            }

            var config = this.getBaseMap(id);
            var changeView = this.getView(id);
            var zoom = this.map.getView().getZoom() ? this.map.getView().getZoom() : this.props.zoom;
            if (id == "google") zoom += 8;
            if (id != "google" && this.preBaseMap == "google") zoom -= 8;
            var preCenter;

            if (!this.map.getView().getCenter()) {
                preCenter = config.center;
            } else {
                preCenter = ol.proj.transform(this.map.getView().getCenter(), this.props.crsCode, config.projection);
            }

            this.map.setView(changeView);

            this.map.getView().setCenter(preCenter);
            this.map.getView().setZoom(zoom);
            this.map.getView().setMaxZoom(this.props.maxZoom);
            this.map.getView().setMinZoom(this.props.minZoom);


            this.props.crsCode = config.projection;
            this.transformFeature();
            this.preBaseMap = id.toLowerCase();
        },

        /**
         * view 불러오기
         * @date 2022.06.17
         * @param id 배경지도 ID (daum, google, vworld)
         * */
        getView: function (id) {
            var view;
            var config = this.getBaseMap(id);

            var zoom = this.map.getView().getZoom() !== undefined ? this.map.getView().getZoom() : this.props.zoom;

            if (id == "google") {
                view = new ol.View({
                    projection: ol.proj.get(config.projection),
                });
            } else if(id == "vworld") {
                view = new ol.View({
                    projection: config.projection,
                    center: config.center,
                    resolutions: config.resolutions,
                    zoom: zoom,
                    zoomFactor: 1,
                    extent: ol.proj.transformExtent([-21951.999999999767, 26752.000037359714, 371264.00000000023, 243840.0000373597], "EPSG:5181", "EPSG:3857")
                    // constrainResolution: true
                });
            } else {
                view = new ol.View({
                    projection: ol.proj.get(config.projection),
                    center: config.center,
                    resolutions: config.resolutions,
                    zoom: zoom,
                    zoomFactor: 1,
                });
            }

            this.view = view;

            return view;
        },

        /**
         * 배경지도 추가
         * @date 2022.06.17
         * */
        _addBaseMap: function () {
            // this._addGoogle(false);
            // this._addVWorld(true);
            this._addDaum(true);
        },

        /**
         * 브이월드 지도 추가
         * @date 2022.06.17
         * @param visible 가시화여부
         * */
        _addVWorld: function (visible, map) {
            if(!map) map = this.map;

            var vHybrid = new ol.layer.Tile({
                id: "VWorldHybrid",
                source: new ol.source.XYZ({
                    projection: "EPSG:3857",
                    url: PATH + "/map/proxy/proxyBackgroundHybrid.do?x={x}&y={y}&z={z}&type=vworld",
                    // url: `http://api.vworld.kr/req/wmts/1.0.0/${VWORLD_KEY}/Hybrid/{z}/{y}/{x}.png`
                }),
                visible: !visible,
            });

            var vSatellite = new ol.layer.Tile({
                id: "VWorldSatellite",
                source: new ol.source.XYZ({
                    projection: "EPSG:3857",
                    url: PATH + "/map/proxy/proxyBackgroundSatellite.do?x={x}&y={y}&z={z}&type=vworld",
                    // url: `http://api.vworld.kr/req/wmts/1.0.0/${VWORLD_KEY}/Satellite/{z}/{y}/{x}.jpeg`
                }),
                visible: !visible,
            });

            var vMap = new ol.layer.Tile({
                id: "VWorldBase",
                source: new ol.source.XYZ({
                    projection: "EPSG:3857",
                    url: PATH + "/map/proxy/proxyBackground.do?x={x}&y={y}&z={z}&type=vworld",
                    // url: `http://api.vworld.kr/req/wmts/1.0.0/${VWORLD_KEY}/Base/{z}/{y}/{x}.png`
                }),
                visible: visible,
            });

            map.addLayer(vMap);
            map.addLayer(vSatellite);
            map.addLayer(vHybrid);

            if(map.getTarget() == this.mapId) {
                this.vMap = vMap;
                this.vHybrid = vHybrid;
                this.vSatellite = vSatellite;
            } else {
                return {
                    vMap,
                    vHybrid,
                    vSatellite
                }
            }
        },

        /**
         * 구글 지도 추가
         * @date 2022.06.17
         * @param visible 가시화여부
         * */
        _addGoogle: function (visible) {
            this.googleHybridMap = new ol.layer.Tile({
                id: "googleSatellite",
                source: new ol.source.XYZ({
                    projection: "EPSG:3857",
                    url: 'http://mt1.google.com/vt/lyrs=s&hl=pl&&x={x}&y={y}&z={z}'
                }),
                visible: visible,
            });

            this.googleLayerMap = new ol.layer.Tile({
                id: "googleSatellite",
                source: new ol.source.XYZ({
                    projection: "EPSG:3857",
                    url: 'http://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
                }),
                visible: visible,
            });

            this.map.addLayer(this.googleHybridMap);
            this.map.addLayer(this.googleLayerMap);
        },

        /**
         * 다음지도 추가
         * @date 2022.06.17
         * @param visible 가시화여부
         * */
        _addDaum: function (visible) {
            var self = this;
            var config = this.getBaseMap("daum");

            // var resolutions = [512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25];
            var resolutions = config.resolutions;
            var extent = config.extent;
            var origin = config.origin;
            var projection = new ol.proj.Projection({
                code: 'EPSG:5181',
                units: '',
                axisOrientation: 'neu'
            });

            // define tile layer
            var base = new ol.layer.Tile({
                id: 'Daum',
                title: 'Daum Street Map',
                visible: visible,
                type: 'base',
                source: new ol.source.XYZ({
                    projection: projection,
                    tileSize: 256,
                    minZoom: 0,
                    maxZoom: resolutions.length - 1,
                    tileGrid: new ol.tilegrid.TileGrid({
                        origin: origin,
                        resolutions: resolutions
                    }),
                    tileUrlFunction: function (tileCoord, pixelRatio, projection) {
                        if (tileCoord == null) return undefined;
                        if (tileCoord[0] >= 14) return undefined;
                        var s = Math.floor(Math.random() * 4); // 0 ~ 3
                        var z = resolutions.length - tileCoord[0];
                        var x = tileCoord[1];
                        var y = tileCoord[2];

                        return "http://map" + s + ".daumcdn.net/map_2d/2205pfk/L" + z + "/" + -y + "/" + x + ".png";
                    }
                })
            });

            this.daumMap = base;

            var satellite = new ol.layer.Tile({
                id: 'DaumSatellite',
                title: 'Daum Satellite',
                visible: !visible,
                type: 'base',
                source: new ol.source.XYZ({
                    projection: projection,
                    tileSize: 256,
                    tileGrid: new ol.tilegrid.TileGrid({
                        origin: origin,
                        resolutions: resolutions
                    }),
                    tileUrlFunction: function (tileCoord, pixelRatio, projection) {
                        if (tileCoord == null) return undefined;
                        var s = Math.floor(Math.random() * 4); // 0 ~ 3
                        var z = tileCoord[0] - 1;
                        var x = tileCoord[1];
                        var y = tileCoord[2];

                        return "http://map" + s + ".daumcdn.net/map_skyview/L" + z + "/" + y + "/" + x + ".jpg?v=160114";
                    }
                })
            });

            this.satellite = satellite;

            var hybrid = new ol.layer.Tile({
                id: 'DaumHybrid',
                title: 'Daum Hybrid',
                visible: !visible,
                type: 'base',
                source: new ol.source.XYZ({
                    projection: projection,
                    tileSize: 256,
                    minZoom: 0,
                    maxZoom: resolutions.length - 1,
                    tileGrid: new ol.tilegrid.TileGrid({
                        origin: origin,
                        resolutions: resolutions
                    }),
                    tileUrlFunction: function (tileCoord, pixelRatio, projection) {
                        if (tileCoord == null) return undefined;
                        var s = Math.floor(Math.random() * 4); // 0 ~ 3
                        var z = resolutions.length - tileCoord[0];
                        var x = tileCoord[1];
                        var y = tileCoord[2];

                        return "http://map" + s + ".daumcdn.net/map_hybrid/1810uis/L" + z + "/" + y + "/" + x + ".png";
                    }
                })
            });

            this.hybridMap = hybrid;

            // extent = [14098021.61, 4170799.78, 14140057.41, 4199108.25];
            // resolutions = [2445.98490512564, 1222.99245256282, 611.49622628141, 305.748113140705, 152.8740565703525, 76.43702828517625, 38.21851414258813, 19.109257071294063, 9.554628535647032, 4.777314267823516, 2.388657133911758, 1.194328566955879, 0.5971642834779395];

            var roadview = new ol.layer.Tile({
                id: 'roadview',
                title: 'roadview',
                visible: false,
                type: 'base',
                source: new ol.source.XYZ({
                    projection: projection,
                    // url: `http://map{0-3}.daumcdn.net/map_roadviewline/7.00/L{z}/{y}/{x}.png`,
                    tileGrid: new ol.tilegrid.TileGrid({
                        origin: [-30000, -60000],
                        resolutions: resolutions
                    }),
                    tileUrlFunction: function (tileCoord, pixelRatio, projection) {
                        if (tileCoord == null) return undefined;
                        var s = Math.floor(Math.random() * 4); // 0 ~ 3
                        var z = resolutions.length - tileCoord[0];
                        var x = tileCoord[1];
                        var y = tileCoord[2];

                        console.log("http://map" + s + ".daumcdn.net/map_roadviewline/7.00/L" + z + "/" + y + "/" + x + ".png");

                        return "http://map" + s + ".daumcdn.net/map_roadviewline/7.00/L" + z + "/" + y + "/" + x + ".png";
                    }
                })
            });

            this.daumRoadView = roadview;

            this.map.addLayer(base);
            // this.map.addLayer(satellite);
            // this.map.addLayer(hybrid);
            // this.map.addLayer(roadview);
        },

        /**
         * 배경지도 변경시 모든 레이어 좌표계 변경
         * @date 2022.06.17
         * */
        transformFeature: function () {
            var self = this;
            var preCrsCode = this.getBaseMap(this.preBaseMap).projection;

            this.map.getLayers().forEach(function (layer) {
                if (layer instanceof ol.layer.Vector) {
                    layer.getSource().getFeatures().forEach(function (feature) {
                        feature.getGeometry().transform(preCrsCode, self.props.crsCode);
                    });
                }
            });
        },

        /**
         * 배경지도 정보 불러오기
         * @date 2022.06.17
         * @param id 배경지도 ID (daum, google, vworld)
         * */
        getBaseMap: function (id) {
            var baseMap;

            if (id.toLowerCase() == "vworld") {
                baseMap = {
                    id: "VWorld",
                    name: "VWorld",
                    korName: "브이월드",
                    projection: "EPSG:3857",
                    tileSize: 256,
                    center: [14080424.619709337, 4137865.1255640355],
                    extent: [14098021.61, 4170799.78, 14140057.41, 4199108.25],
                    resolutions: [2445.98490512564, 1222.99245256282, 611.49622628141, 305.748113140705, 152.8740565703525, 76.43702828517625, 38.21851414258813, 19.109257071294063, 9.554628535647032, 4.777314267823516, 2.388657133911758, 1.194328566955879, 0.5971642834779395],
                };
            } else if (id.toLowerCase() == "daum") {
                baseMap = {
                    id: "Daum",
                    name: "Daum",
                    korName: "다음",
                    projection: "EPSG:5181",
                    tileSize: 256,
                    // center: [228739.43298, 519133.99660], //철원
                    center: [226202.56538322405, 330999.35865361197], //세종
                    // center: [186469.67, 184868.86],
                    origin: [-30000, -60000],
                    extent: [-30000 - Math.pow(2, 19) * 4, -60000, -30000 + Math.pow(2, 19) * 5, -60000 + Math.pow(2, 19) * 5],
                    resolutions: [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25],
                };
            } else if (id.toLowerCase() == "google") {
                baseMap = {
                    id: "Google",
                    name: "Google",
                    korName: "구글",
                    projection: "EPSG:3857",
                };
            } else if (id.toLowerCase() == "naver") {
                baseMap = {
                    id: "Naver",
                    name: "Naver",
                    korName: "네이버",
                    projection: "EPSG:5179",
                    tileSize: 256,
                    center: [940937.89, 1685177.30],
                    extent: [90112, 1192896, 1990673, 2765760],
                    resolutions: [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25]
                };
            }

            return baseMap;
        },

        roadViewInit: function (target) {
            this.roadViewTarget = target;

            this.overlayElement = document.createElement("div");
            this.overlayElement.className = "roadViewPointer";

            if (this.overlayRoadViewLayer) {
                this.map.removeOverlay(this.overlayRoadViewLayer);
            }

            this.overlayRoadViewLayer = new ol.Overlay({
                element: this.overlayElement,
                offset: [0, 0],
                stopEvent: false,
                positioning: "bottom-center",
            });
            this.map.addOverlay(this.overlayRoadViewLayer);

            this.map.un("click", this.roadViewClickEvent);
            this.map.un("pointermove", this._pointerMove);

            this.map.on("click", this.roadViewClickEvent);
            this.map.on("pointermove", this._pointerMove);
            $("#" + this.id).on("mouseleave", this.hideRoadViewPointer);
            $("#" + this.id).on("mouseenter", this.showRoadViewPointer);
        },

        hideRoadViewPointer: function () {
            $(".roadViewPointer").hide();
        },

        showRoadViewPointer: function () {
            $(".roadViewPointer").show();
        },

        roadView: function (target, coord) {
            var self = this;

            if (this.mapWalker) {
                this.getFakeRoadView(target, coord);

                $(".sisMapWalker").show();

                return false;
            }

            if (this.sisRoadViewOverlay) {
                this.map.removeOverlay(this.sisRoadViewOverlay);
            }

            if (this.overlayRoadViewLayer) {
                this.map.removeOverlay(this.overlayRoadViewLayer);
            }

            this.sisRoadViewOverlay = new ol.Overlay({
                element: document.querySelector(".sisMapWalker"),
                offset: [0, 0],
                stopEvent: false,
            });
            // 오버레이 생성
            this.map.addOverlay(this.sisRoadViewOverlay);

            // 다음 API 사용
            var script = document.createElement("script");
            script.async = true;
            script.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=a21305a637be88f606d7dd6aa2643f29&autoload=false";
            document.head.appendChild(script);

            // 로드뷰를 위한 hidden 다음맵
            script.onload = function () {
                kakao.maps.load(function () {
                    var center = ol.proj.transform(sis.props.center, "EPSG:3857", "EPSG:4326");
                    var container = document.getElementById("daumMap");
                    var options = {
                        center: new kakao.maps.LatLng(center[1], center[0]),
                        level: 14 - sis.props.zoom,
                    };

                    self.daumMapHidden = new kakao.maps.Map(container, options); //지도 생성
                    self.getFakeRoadView(target, coord);

                    // this.map.un("click", this.roadViewClickEvent);
                    // this.map.on("click", this.roadViewClickEvent);
                });
            };
        },

        getFakeRoadView: function (target, coord) {
            var self = this;

            var roadview = new kakao.maps.Roadview(target);
            target.style.display = "block";
            var roadviewClient = new kakao.maps.RoadviewClient();
            var position = new kakao.maps.LatLng(coord[1], coord[0]);
            var olPos = ol.proj.transform([parseFloat(coord[0]), parseFloat(coord[1])], "EPSG:4326", this.props.crsCode);

            //로드뷰 생성
            roadviewClient.getNearestPanoId(position, 100, function (panoId) {
                //var oriPosition = self.sisRoadViewOverlay.getPosition();

                if (panoId) {
                    //$($(target).find("object")[0]).remove();
                    //$(target).find("div:not(.close)").remove();

                    sis.daumRoadView.setVisible(true);
                    roadview.setPanoId(panoId, position);

                    olPos = ol.proj.transform([position.getLng(), position.getLat()], "EPSG:4326", self.props.crsCode);
                    sis.sisRoadViewOverlay.setPosition(olPos);
                    sis.setCenter(olPos, self.props.crsCode);
                    sis.setDetailZoom();
                } else {
                    alert("로드뷰가 존재하지 않는 위치입니다.");

                    if ($(".toggle").hasClass("close")) $(".toggle")[0].click();
                    $(".btnRoadView").click();

                    //self.closeRoadView(roadviewContainer, true);

                    //$(target).find("div:not(.close)").remove();
                    //self.sisRoadViewOverlay.setPosition(self.prePosition);
                    // closeRoadView(target);
                }
            });

            // 로드뷰 컨트롤러 생성
            kakao.maps.event.addListener(roadview, "init", function () {
                if (!self.mapWalker) self.mapWalker = new FakeMapWalker(position);
                self.mapWalker.setMap(self.daumMapHidden);
                $(".sisMapWalker").show();

                kakao.maps.event.addListener(roadview, "viewpoint_changed", function () {
                    // 이벤트가 발생할 때마다 로드뷰의 viewpoint값을 읽어, map walker에 반영
                    var viewpoint = roadview.getViewpoint();
                    self.mapWalker.setAngle(viewpoint.pan);
                });

                kakao.maps.event.addListener(roadview, "position_changed", function () {
                    // 이벤트가 발생할 때마다 로드뷰의 position값을 읽어, map walker에 반영
                    var position = roadview.getPosition();
                    self.mapWalker.setPosition(position);

                    olPos = ol.proj.transform([position.getLng(), position.getLat()], "EPSG:4326", self.props.crsCode);
                    self.sisRoadViewOverlay.setPosition(olPos);
                    self.setCenter(olPos, self.props.crsCode);
                });
            });

            setTimeout(function () {
                self.map.updateSize();
            }, 100);
        },

        removeRoadViewObject: function (target) {
            $(target).hide();
            $(target).find("object").remove();
            $(target).find("div:not(.close)").remove();
        },

        closeRoadView: function (target, isAllClear) {
            if (!isAllClear) return false;
            this.daumRoadView.setVisible(false);
            if (this.sisRoadViewOverlay) this.map.removeOverlay(this.sisRoadViewOverlay);

            $(".sisMapWalker").hide();

            $("#" + sis.mapId).removeAttr("style");

            //
            $(sis.map.getTargetElement()).parent().css({right: "0"});
            sis.removeRoadViewObject(target);

            sis.map.un("click", this.roadViewClickEvent);
            sis.map.un("pointermove", this._pointerMove);

            $("#" + this.id).off("mouseleave", this.hideRoadViewPointer);
            $("#" + this.id).off("mouseenter", this.showRoadViewPointer);

            $(".roadViewPointer").hide();

            sis.map.updateSize();
        },

        setDetailZoom: function () {
            sis.map.getView().setZoom(10);
        },

        roadViewClickEvent: function (e) {
            var self = sis;
            if (self.sisRoadViewOverlay) {
                self.prePosition = self.sisRoadViewOverlay.getPosition();

                //var olPos = transform(e.coordinate, self.crsCode, "EPSG:4326");
                self.sisRoadViewOverlay.setPosition(e.coordinate);
            }

            var coord = ol.proj.transform(e.coordinate, self.map.getView().getProjection().getCode(), "EPSG:4326");

            sis.roadView(sis.roadViewTarget, coord);

            $("#" + sis.mapId).css({
                zIndex: 9999,
                width: "320px",
                height: "200px",
                left: 0,
                bottom: 0,
                top: "auto",
                border: "2px solid #fff",
                position: "absolute",
            });

            $(".roadViewHidden, .footer").hide();
            $(".ol-overlaycontainer-stopevent").hide();

            $(".mapRight.menu").hide();
            $("#previewWrap").hide();
            $(".currentArea").hide();
        },

        _pointerMove: function (e) {
            sis.overlayRoadViewLayer.setPosition(e.coordinate);
        },
    }
})(window, jQuery);

//지도위에 현재 로드뷰의 위치와, 각도를 표시하기 위한 map walker 아이콘 생성 클래스
function FakeMapWalker(position) {
    //커스텀 오버레이에 사용할 map walker 엘리먼트
    var content = document.createElement("div");
    var figure = document.createElement("div");
    var angleBack = document.createElement("div");

    //map walker를 구성하는 각 노드들의 class명을 지정 - style셋팅을 위해 필요
    content.className = "sisMapWalker";
    figure.className = "figure";
    angleBack.className = "angleBack";

    content.appendChild(angleBack);
    content.appendChild(figure);

    //커스텀 오버레이 객체를 사용하여, map walker 아이콘을 생성
    var walker = new kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1,
    });

    this.walker = walker;
    this.content = content;
}

//로드뷰의 pan(좌우 각도)값에 따라 map walker의 백그라운드 이미지를 변경 시키는 함수
//background로 사용할 sprite 이미지에 따라 계산 식은 달라 질 수 있음
FakeMapWalker.prototype.setAngle = function (angle) {
    var threshold = 22.5; //이미지가 변화되어야 되는(각도가 변해야되는) 임계 값
    for (var i = 0; i < 16; i++) {
        //각도에 따라 변화되는 앵글 이미지의 수가 16개
        if (angle > threshold * i && angle < threshold * (i + 1)) {
            //각도(pan)에 따라 아이콘의 class명을 변경
            var className = "m" + i;
            this.content.className = this.content.className.split(" ")[0];
            this.content.className += " " + className;
            $(".sisMapWalker").attr("class", this.content.className);
            break;
        }
    }
};

//map walker의 위치를 변경시키는 함수
FakeMapWalker.prototype.setPosition = function (position) {
    this.walker.setPosition(position);
};

//map walker를 지도위에 올리는 함수
FakeMapWalker.prototype.setMap = function (map) {
    this.walker.setMap(map);
};
