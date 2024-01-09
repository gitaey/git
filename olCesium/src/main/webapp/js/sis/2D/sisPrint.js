(function (window, $) {
    window.SisPrint = function (mapId, parentMap, props) {
        if (!mapId) {
            alert("Print MapId를 설정해 주세요");
            return false;
        };

        if (!parentMap) {
            alert("Parent Map을 설정해 주세요");
            return false;
        };

        this.pMap = parentMap;
        this.mapId = mapId;
        this._init(props);
    }

    SisPrint.prototype = {
        props: {
            isChrome: false,
            isPopup: true
        },

        printLayer: null,

        _init: function (props) {
            this.extendProps(props);
            this._setProj4();

            $("#" + this.mapId).html("");

            this._createMap();
        },

        extendProps: function (props) {
            this.props = $.extend({}, this.props, props);
        },

        _setProj4: function () {
            proj4.defs(
                "EPSG:5181",
                // "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs"
                "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
            );
            proj4.defs("EPSG:5186", "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs");

            ol.proj.proj4.register(proj4);
        },

        _createMap: function () {
            var self = this;
            var pMap = this.pMap;
            var isDrag = true;

            var extent = pMap.getView().calculateExtent(pMap.getSize());
            var center = pMap.getView().getCenter();
            var zoom = pMap.getView().getZoom();
            this.minZoom = zoom;
            this.maxZoom = zoom;

            var controls;

            this.map = new ol.Map({
                target: this.mapId,
                renderer: 'canvas',
                interactions: ol.interaction.defaults({
                    doubleClickZoom: false,
                    dragPan: isDrag,
                    mouseWheelZoom: false
                }),
                controls: ol.control.defaults({
                    attribution: false,
                    zoom: false,
                    rotate: false,
                }).extend([new ol.control.ScaleLine({
                    units: "metric",
                    bar: true,
                    minWidth: 140
                })]),
                view: new ol.View({
                    projection: pMap.getView().getProjection().getCode(),
                    center: center,
                    zoom: zoom,
                    minZoom: this.minZoom,
                    maxZoom: this.maxZoom,
                    resolutions: pMap.getView().getResolutions()
                })
            });

            this.loading = 0;
            this.loaded = 0;

            this._addLayers();

            this.printLayer = new ol.layer.Vector({
                name: "printLayer",
                id: "printLayer",
                source: new ol.source.Vector(),
                projection: this.pMap.getView().getProjection().getCode(),
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'rgba(255,0,0,1)',
                        width: 2
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(255,0,0,0)'
                    })
                }),
                zIndex: 999
            });

            this.map.addLayer(this.printLayer);

            // // wkt가 있을때
            // if (wkt) {
            //     var format = new ol.format.WKT();
            //     var geom = format.readGeometry(wkt);
            //
            //     this.printLayer.getSource().addFeature(new ol.Feature({
            //         geometry: geom
            //     }));
            //
            //     this.map.getView().fit(extent, this.map.getSize());
            // }
        },

        _addLayers: function () {
            var self = this;

            var source = "",
                id = "",
                tempOverlay = null;

            this.pMap.getOverlays().forEach((overlay, i) => {
                tempOverlay = new ol.Overlay({
                    element: $(overlay.getElement()).clone()[0],
                    position: overlay.getPosition(),
                });

                self.map.addOverlay(tempOverlay);
            });

            this._addDaum(false);
            this._addGoogle(false);

            this.pMap.getLayers().forEach((lyr, i) => {
                source = lyr.getSource();
                id = lyr.get("id");

                if (lyr instanceof ol.layer.Tile) {
                    if (source instanceof ol.source.XYZ) {
                        if (id === "Daum") {
                            this.daumMap.setVisible(lyr.getVisible());
                        } else if (id === "DaumSatellite") {
                            this.daumSatellite.setVisible(lyr.getVisible());
                        } else if (id === "DaumHybrid") {
                            this.daumHybrid.setVisible(lyr.getVisible());
                        } else if (id === "GoogleHybrid") {
                            this.googleHybridMap.setVisible(lyr.getVisible());
                        } else if (id === "GoogleLayerMap") {
                            this.googleLayerMap.setVisible(lyr.getVisible());
                        }
                    } else if (source instanceof ol.source.TileWMS) {
                        this.addWmsLayer(lyr);
                    } else {
                        //this.addWmsLayer(lyr);
                        // this.createAirphoto(lyr);
                    }
                }

                if (lyr instanceof ol.layer.Image) {
                    this.addWmsLayer(lyr);
                }

                if (lyr instanceof ol.layer.Vector) {
                    const vector = new ol.layer.Vector(lyr.getProperties());
                    vector.setStyle(lyr.getStyle());

                    self.map.addLayer(vector);
                }
            });
        },

        getParentLayerById: function (id) {
            var rtnLyr = null;
            this.pMap.getLayers().forEach(function (lyr, idx) {
                if (id === lyr.get("id")) {
                    rtnLyr = lyr;
                    return false;
                }
            });

            return rtnLyr;
        },

        addWmsLayer: function (lyr) {
            var visible = lyr.getVisible();

            lyr = new ol.layer.Tile({
                title: lyr.get("id"),
                id: lyr.get("id"),
                source: new ol.source.TileWMS({
                    projection: this.map.getView().getProjection().getCode(),
                    url: "/map/proxy/wms.do",
                    // url: "http://106.251.243.138:9001/geoserver/sde/wms",
                    params: lyr.getSource().getParams(),
                    serverType: "geoserver",
                }),
                visible: visible,
                zIndex: lyr.getZIndex(),
                maxResolution: lyr.getMaxResolution(),
                minResolution: lyr.getMinResolution(),
                opacity: lyr.getOpacity(),
            });

            this.map.addLayer(lyr);

            return lyr;
        },

        addImageLayer: function (lyr) {
            // var self = this;
            var visible = lyr.getVisible();
            lyr.getSource().updateParams({
                WIDTH: 512,
                HEIGHT: 512
            });

            lyr = new ol.layer.Image({
                title: lyr.get("name"),
                id: lyr.get("name"),
                source: new ol.source.ImageWMS({
                    projection: this.map.getView().getProjection().getCode(),
                    url: "/map/proxy/wms.do",
                    // url: "http://106.251.243.138:9001/geoserver/sde/wms",
                    params: lyr.getSource().getParams(),
                    serverType: "geoserver",
                }),
                visible: visible,
                zIndex: lyr.getZIndex(),
                maxResolution: lyr.getMaxResolution(),
                minResolution: lyr.getMinResolution(),
                opacity: lyr.getOpacity(),
            });

            this.map.addLayer(lyr);

            return lyr;
        },

        addLabelLayer: function (layerName, params, callback) {
            var self = this;

            this.wfs = this.wfs ? this.wfs : {};
            this.wfs[layerName] = new VectorLayer({
                id: layerName,
                projection: this.map.getView().getProjection().getCode(),
                declutter: true,
                source: new VectorSource({}),
            });

            this.wfs[layerName].setStyle(function (f) {
                var text = "";

                if (self.map.getView().getZoom() >= 10) {
                    text = f.get("label");
                } else {
                    text = "";
                }

                return [
                    new Style({
                        fill: new Fill({
                            color: "rgba(255,255,255,0.4)",
                        }),
                        stroke: new Stroke({
                            color: "#0000ff",
                            width: 2,
                        }),
                        text: new Text({
                            font: "15px Calibri,sans-serif",
                            fill: new Fill({
                                color: "#000",
                            }),
                            stroke: new Stroke({
                                color: "#fff",
                                width: 2,
                            }),
                            text: text,
                            offsetX: 10,
                            offsetY: -10,
                            placement: "line",
                            overflow: true,
                        }),
                    }),
                ];
            });

            this.map.addLayer(this.wfs[layerName]);

            return this.wfs[layerName];
        },

        //Zoom으로부터 Resolution값 가져오기
        _getResolution: function (zoom) {
            return this.map.getView().getResolutionForZoom(zoom);
        },

        _addGoogle: function (visible) {
            this.googleHybridMap = new ol.layer.Tile({
                id: "GoogleHybrid",
                title: "Google Satellite",
                source: new ol.source.XYZ({
                    projection: "EPSG:3857",
                    url: 'http://mt{0-3}.google.com/vt/lyrs=s%26hl=pl&x={x}&y={y}&z={z}',
                    tileLoadFunction: function(imageTile, src) {
                        imageTile.getImage().src = "/map/proxy/proxyBackgroundByUrl.do?url=" + encodeURIComponent(encodeURIComponent(src));
                    }
                }),
                visible: visible,
            });

            this.googleLayerMap = new ol.layer.Tile({
                id: "GoogleLayerMap",
                title: "Google Satellite & Roads",
                source: new ol.source.XYZ({
                    projection: "EPSG:3857",
                    url: 'http://mt{0-3}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                    tileLoadFunction: function(imageTile, src) {
                        imageTile.getImage().src = "/map/proxy/proxyBackgroundByUrl.do?url=" + encodeURIComponent(encodeURIComponent(src));
                    }
                }),
                visible: visible,
            });

            this.map.addLayer(this.googleHybridMap);
            this.map.addLayer(this.googleLayerMap);
        },

        _addVWorld: function (visible) {
            var base = new ol.layer.Tile({
                id: "VWorld",
                title: "VWorld Street Map",
                visible: visible,
                source: new ol.source.XYZ({
                    url: "/map/proxy/proxyBackground.do?url=http://xdworld.vworld.kr:8080/2d/Base/201512/{z}/{x}/{y}.png",
                    project: "EPSG:3857",
                })
            });

            this.map.addLayer(base);
        },

        _addNaver: function (visible) {
            var resolutions = [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25];
            var extent = [90112, 1192896, 2187264, 2765760]; // 4 * 3

            var projection = new ol.proj.Projection({
                code: 'EPSG:5179',
                extent: extent,
                units: 'm'
            });

            // define tile layer
            var base = new ol.layer.Tile({
                id: 'Naver',
                title: 'Naver Street Map',
                visible: visible,
                type: 'base',
                source: new ol.source.XYZ({
                    projection: projection,
                    tileSize: 256,
                    minZoom: 0,
                    maxZoom: resolutions.length - 1,
                    tileGrid: new ol.tilegrid.TileGrid({
                        extent: extent,
                        origin: [extent[0], extent[1]],
                        resolutions: resolutions
                    }),
                    tileUrlFunction: function (tileCoord, pixelRatio, projection) {
                        if (tileCoord == null)
                            return undefined;

                        var s = Math.floor(Math.random() * 3) + 1; // 1 ~ 4
                        var z = tileCoord[0] + 1;
                        var x = tileCoord[1];
                        var y = tileCoord[2];

                        return 'http://onetile' + s + '.map.naver.net/get/149/0/0/' + z + '/' + x + '/' + y + '/bl_vc_bg/ol_vc_an';
                    }
                })
            });

            this.map.addLayer(base);
        },

        _addDaum: function (visible) {
            // 직접 불러오기
            var config = this.getBaseMap("daum");

            // var resolutions = config.resolutions;
            var resolutions = [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25];
            var extent = config.extent;
            var origin = config.origin;
            var projection = new ol.proj.Projection({
                code: config.projection,
                extent: extent,
                units: "m",
            });

            // define tile layer
            this.daumMap = new ol.layer.Tile({
                id: "Daum",
                title: "Daum Street Map",
                visible: false,
                type: "base",
                zIndex: -1,
                source: new ol.source.XYZ({
                    url: "/map/proxy/proxyBackground.do?x={x}&y={y}&z={z}&length=" + resolutions.length,
                    // url: "/map_2d/1810uis/L{z}/x={x}&y={y}",
                    projection: projection,
                    tileSize: 256,
                    tilePixelRatio: 1,
                    minZoom: 0,
                    maxZoom: resolutions.length - 1,
                    tileGrid: new ol.tilegrid.TileGrid({
                        origin: origin,
                        resolutions: resolutions,
                    }),
                    // tileUrlFunction: function (tileCoord, pixelRatio, projection) {
                    // 	if (tileCoord == null) return undefined;
                    // 	if (tileCoord[0] >= 14) return undefined;
                    // 	var s = Math.floor(Math.random() * 4); // 0 ~ 3
                    // 	var z = resolutions.length - tileCoord[0];
                    // 	var x = tileCoord[1];
                    // 	var y = tileCoord[2] + 1;

                    // 	return "daum" + s + "/map_2d/1810uis/L" + z + "/" + -y + "/" + x + ".png";
                    // 	// return "/map_2d/1810uis/L" + z + "/" + -y + "/" + x + ".png";
                    // },
                }),
            });

            this.daumSatellite = new ol.layer.Tile({
                id: "DaumSatellite",
                title: "Daum Satellite",
                visible: false,
                type: "base",
                source: new ol.source.XYZ({
                    projection: projection,
                    tileSize: 256,
                    minZoom: 0,
                    maxZoom: resolutions.length - 1,
                    tileGrid: new ol.tilegrid.TileGrid({
                        origin: origin,
                        resolutions: resolutions,
                    }),
                    tileUrlFunction: function (tileCoord, pixelRatio, projection) {
                        if (tileCoord == null) return undefined;
                        var s = Math.floor(Math.random() * 4); // 0 ~ 3
                        var z = resolutions.length - tileCoord[0];
                        var x = tileCoord[1];
                        var y = tileCoord[2] + 1;

                        return "/map/proxy/proxyBackgroundByUrl.do?url=http://map" + s + ".daumcdn.net/map_skyview/L" + z + "/" + -y + "/" + x + ".jpg?v=160114";
                    },
                }),
            });

            this.daumHybrid = new ol.layer.Tile({
                id: "DaumHybrid",
                title: "Daum Hybrid",
                visible: false,
                type: "base",
                source: new ol.source.XYZ({
                    projection: projection,
                    tileSize: 256,
                    minZoom: 0,
                    maxZoom: resolutions.length - 3,
                    tileGrid: new ol.tilegrid.TileGrid({
                        origin: origin,
                        resolutions: resolutions,
                    }),
                    tileUrlFunction: function (tileCoord, pixelRatio, projection) {
                        if (tileCoord == null) return undefined;
                        var s = Math.floor(Math.random() * 4); // 0 ~ 3
                        var z = resolutions.length - tileCoord[0];
                        var x = tileCoord[1];
                        var y = tileCoord[2] + 1;

                        return "/map/proxy/proxyBackgroundByUrl.do?url=http://map" + s + ".daumcdn.net/map_hybrid/1810uis/L" + z + "/" + -y + "/" + x + ".png";
                    },
                }),
            });

            this.daumRoadView = new ol.layer.Tile({
                id: "roadview",
                title: "roadview",
                visible: false,
                type: "base",
                source: new ol.source.XYZ({
                    projection: projection,
                    tileSize: 256,
                    minZoom: 0,
                    maxZoom: resolutions.length - 1,
                    tileGrid: new ol.tilegrid.TileGrid({
                        origin: origin,
                        resolutions: resolutions,
                    }),
                    tileUrlFunction: function (tileCoord, pixelRatio, projection) {
                        if (tileCoord == null) return undefined;
                        var s = Math.floor(Math.random() * 4); // 0 ~ 3
                        var z = resolutions.length - tileCoord[0];
                        var x = tileCoord[1];
                        var y = tileCoord[2] + 1;
                        return "http://map" + s + ".daumcdn.net/map_roadviewline/7.00/L" + z + "/" + -y + "/" + x + ".png";
                    },
                }),
            });

            this.map.addLayer(this.daumMap);
            this.map.addLayer(this.daumSatellite);
            this.map.addLayer(this.daumHybrid);
        },

        // 베이스맵 config 가져오기
        getBaseMap: function(id) {
            var baseMap;

            if (id.toLowerCase() === "vworld") {
                baseMap = {
                    id: "VWorld",
                    name: "VWorld",
                    korName: "브이월드",
                    projection: "EPSG:3857",
                    tileSize: 256,
                    center: [14121043.79, 4185661.96],
                    extent: [14098021.61, 4170799.78, 14140057.41, 4199108.25],
                    //					resolutions : [38.218514142588134, 19.109257071294067, 9.554628535647034, 4.777314267823517, 2.3886571339117584, 1.1943285669558792, 0.5971642834779396, 0.2985821417389698, 0.1492910708694849, 0.0746455354347425],
                    resolutions: [2445.98490512564, 1222.99245256282, 611.49622628141, 305.748113140705, 152.8740565703525, 76.43702828517625, 38.21851414258813, 19.109257071294063, 9.554628535647032, 4.777314267823516, 2.388657133911758],
                    //					resolutions : [ 38.21851414258813, 76.43702828517625, 152.8740565703525, 305.748113140705, 611.49622628141, 1222.99245256282, 2445.98490512564 ],
                };
            } else if (id.toLowerCase() === "daum") {
                baseMap = {
                    id: "Daum",
                    name: "Daum",
                    korName: "다음",
                    projection: "EPSG:5181",
                    tileSize: 256,
                    center: [186469.67, 184868.86],
                    origin: [-30000, -60000],
                    extent: [-30000 - Math.pow(2, 19) * 4, -60000, -30000 + Math.pow(2, 19) * 5, -60000 + Math.pow(2, 19) * 5],
                    resolutions: [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25, 0.125, 0.0625, 0.03125],
                };
            } else if (id.toLowerCase() === "naver") {
                baseMap = {
                    id: "Naver",
                    name: "Naver",
                    korName: "네이버",
                    projection: "EPSG:5179",
                    tileSize: 256,
                    center: [940937.89, 1685177.3],
                    extent: [90112, 1192896, 1990673, 2765760],
                    resolutions: [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25],
                };
            }

            return baseMap;
        },
    }

})(window, jQuery);