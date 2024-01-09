(function (window, $) {
    "use strict";

    window.SisLayer = function (map, crsCode, props) {
        if (!map) {
            alert("Layer map을 지정하여 주세요")
            return false;
        }

        if (!crsCode) {
            alert("Layer crsCode를 지정하여 주세요")
            return false;
        }

        this.map = map;
        this.crsCode = this.map.getView().getProjection().getCode();
        this.dataCrsCode = crsCode;
        this._init(props);
    };

    SisLayer.prototype = {
        props: {},

        wms: {},

        wfs: {
            selectLayer: new ol.layer.Vector({
                name: "selectLayer",
                id: "selectLayer",
                source: new ol.source.Vector(),
                style: new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 6,
                        stroke: new ol.style.Stroke({
                            color: 'rgba(255,0,0,1)',
                            width: 2
                        }),
                        fill: new ol.style.Fill({
                            color: 'rgba(255,0,0,1)'
                        })
                    }),
                    stroke: new ol.style.Stroke({
                        width: 2,
                        color: 'rgba(255,0,0,1)'
                    }),
                    fill: new ol.style.Fill({
                        width: 2,
                        color: 'white'
                    })
                }),
                zIndex: 9999
            }),

            searchLayer: new ol.layer.Vector({
                name: "searchLayer",
                id: "searchLayer",
                source: new ol.source.Vector(),
                style: new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 6,
                        stroke: new ol.style.Stroke({
                            color: 'rgba(255,0,0,1)',
                            width: 2
                        }),
                        fill: new ol.style.Fill({
                            color: 'rgba(255,0,0,1)'
                        })
                    }),
                    stroke: new ol.style.Stroke({
                        width: 2,
                        color: 'rgba(255,0,0,1)'
                    }),
                    fill: new ol.style.Fill({
                        width: 2,
                        color: 'white'
                    })
                }),
                zIndex: 999
            }),

            roadviewLayer: new ol.layer.Vector({
                name: "roadviewLayer",
                id: "roadviewLayer",
                source: new ol.source.Vector(),
                zIndex: 999
            }),
        },

        select: null,

        _init: function (props) {
            var self = this;

            this.extendProps(props);

            $.each(this.wfs, function (id, lyr) {
                self.map.addLayer(lyr);
            });

            this.select = new ol.interaction.Select({
                condition: ol.events.condition.click,
                layers: [this.wfs.selectLayer]
            });
        },

        extendProps: function (props) {
            this.props = $.extend({}, this.props, props);
        },

        //ID로 레이어 검색
        getLayerById: function (id) {
            if (!id || !this.map)
                return null;
            var lyr = null;

            this.map.getLayers().forEach(function (item, idx) {
                if (item.get("id") == id)
                    lyr = item;
            });

            return lyr;
        },

        //ID로 레이어 삭제
        removeLayerById: function (id, map) {
            var lyr = this.getLayerById(id);

            if (!lyr)
                return;
            else
                this.map.removeLayer(lyr);
        },

        createFeatureByWKT: function (geom) {
            let feature;

            let format = new ol.format.WKT();
            feature = format.readFeature(geom, {
                featureProjection: sis.props.crsCode,
                dataProjection: sis.props.geoserverCrsCode
            });

            return feature;
        },

        // Vector 레이어 생성
        createVectorLayer: function (id) {
            return new ol.layer.Vector({
                id: id,
                source: new ol.source.Vector(),
                style: new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 6,
                        stroke: new ol.style.Stroke({
                            color: 'rgba(255,0,0,1)',
                            width: 2
                        }),
                        fill: new ol.style.Fill({
                            color: 'rgba(255,0,0,1)'
                        })
                    }),
                    stroke: new ol.style.Stroke({
                        width: 2,
                        color: 'rgba(255,0,0,1)'
                    }),
                    fill: new ol.style.Fill({
                        width: 2,
                        color: 'white'
                    })
                })
            })
        },

        //WMS 레이어 추가
        addWmsLayer: function (layerName, params) {
            var visible, opacity, filter;

            visible = params.visibility;
            opacity = params.opacity;
            filter = params.filter;

            if(!params.image) {
                this.wms[layerName] = new ol.layer.Tile({
                    kind: params.type,
                    title: layerName,
                    id: layerName,
                    name: layerName,
                    source: new ol.source.TileWMS({
                        // projection : "EPSG:5181",
                        url: "http://106.251.243.138:9001/geoserver/sde/wms",
                        params: {
                            LAYERS: layerName.trim(),
                            VERSION: '1.1.1',
                            FORMAT: "image/png",
                            TRANSPARENT: true,
                            CQL_FILTER: filter
                        },
                        serverType: "geoserver",
                    }),
                    visible: visible,
                    zIndex: params.zIndex,
                    minResolution: this._getResolution(params.maxZoom),
                    maxResolution: this._getResolution(params.minZoom ) + 1,
                    opacity: opacity
                });
            } else {
                this.wms[layerName] = new ol.layer.Image({
                    kind: params.type,
                    title: layerName,
                    id: layerName,
                    name: layerName,
                    source: new ol.source.ImageWMS({
                        // projection : "EPSG:5181",
                        url: "http://106.251.243.138:9001/geoserver/sde/wms",
                        params: {
                            LAYERS: layerName.trim(),
                            VERSION: '1.1.1',
                            FORMAT: "image/png",
                            TRANSPARENT: true,
                            CQL_FILTER: filter
                        },
                        serverType: "geoserver",
                    }),
                    visible: visible,
                    zIndex: params.zIndex,
                    minResolution: this._getResolution(params.maxZoom),
                    maxResolution: this._getResolution(params.minZoom ) + 1,
                    opacity: opacity
                });
            }

            this.map.addLayer(this.wms[layerName]);

            return this.wms[layerName];
        },

        /**
         * wfs 레이어 불러오기
         *
         * @date 2017-02-24
         * @method
         * @name git.layer.wfs.addWfsLayer
         * @param layerName
         *            레이어명
         * @param params
         *            레이러 속성 [한글명(korName), 종류(kind), 스타일(style)] 필수!!
         */
        addWfsLayer: function (layerName, params, callback) {
            var self = this;
            var geojsonFormat = new ol.format.GeoJSON();
            var maxRes = 300;
//			var maxRes = params.maxResolution;
            if (!maxRes)
                maxRes = 1.5;

            var data = {};

            self.wfs[layerName] = new ol.layer.Vector({
                kind: params.type,
                title: params.id.trim(),
                id: params.id.trim(),
                maxResolution: maxRes,
                projection: this.crsCode,
                source: new ol.source.Vector({
                    loader: function (extent, resolution, projection) {
                        self.wfs[layerName].getSource().clear(true);

                        if (!params.filter) {
                            data = {
                                request: 'GetFeature',
                                version: '1.1.1',
                                typename: layerName,
                                outputFormat: 'application/json',
                                bbox: extent.join(',') + ',' + self.crsCode
                            }
                        } else {
                            data = {
                                request: 'GetFeature',
                                version: '1.1.1',
                                typename: layerName,
                                outputFormat: 'application/json',
                                CQL_FILTER: params.filter
                            }
                        }

                        if (callback) {
                            eval(callback)(data);
                        } else {
                            $.ajax({
                                url: PATH + "/map/proxy/wfs.do",
                                dataType: 'json',
                                async: true,
                                data: data,
                                success: function (response) {
                                    var fs = geojsonFormat.readFeatures(response, {
                                        featureProjection: self.crsCode,
                                        dataProjection: "EPSG:5186"
                                    });

                                    self.wfs[layerName].getSource().addFeatures(fs);
                                },
                                error: function (a, b, c) {
                                    console.log("error");
                                }
                            })
                        }
                    },
                    strategy: ol.loadingstrategy.bbox
                }),
                visible: true
                // style : params.style
            });

            this.map.addLayer(this.wfs[layerName]);

            return this.wfs[layerName];
        },

        addLabelLayer: function (layerName, params, callback) {
            var self = this;

            this.wfs[layerName] = new ol.layer.Vector({
                id: layerName,
                projection: self.crsCode,
                declutter: true,
                source: new ol.source.Vector({}),
            });

            this.wfs[layerName].setStyle(function (f) {
                var text = "";

                if (self.map.getView().getZoom() >= 10) {
                    text = f.get("label");
                } else {
                    text = "";
                }

                return [new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255,255,255,0.4)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 0, 255, 1)',
                        width: 2
                    }),
                    text: new ol.style.Text({
                        font: '15px Calibri,sans-serif',
                        fill: new ol.style.Fill({
                            color: '#000'
                        }),
                        stroke: new ol.style.Stroke({
                            color: '#fff',
                            width: 2
                        }),
                        text: text,
                        offsetX: 10,
                        offsetY: -10,
                        placement: "line",
                        overflow: true
                    })
                })]
            });

            this.map.addLayer(this.wfs[layerName]);

//			[186588.354375, 184350.30375]


            return this.wfs[layerName];
        },

        // Zoom으로부터 Resolution값 가져오기
        _getResolution: function (zoom) {
            return this.map.getView().getResolutionForZoom(zoom);
        },

        getWmsProperty: function (param) {
            this.extendProps(param);
            this.offClick_Wms();
            this.onClick_Wms();

            this.isEditSelect = true;
        },

        stopWmsProperty: function () {
            this.offClick_Wms();
            this.isEditSelect = false;
        },

        offClick_Wms: function () {
            this.wfs.selectLayer.getSource().clear();
            this.map.removeInteraction(this.select);
            this.map.un("click", this._onClick_Wms, this);

            this.isEditSelect = false;
        },

        onClick_Wms: function () {
            var lyr = this.getLayerById(this.props.target);

            this.map.addInteraction(this.select);

            this.map.on("click", this._onClick_Wms, this);
        },

        _onClick_Wms: function (evt) {
            var self = this;
            var zoom = this.map.getView().getZoom();

            var format = new ol.format.GeoJSON();
            var lyr = this.getLayerById(this.props.target);

            if (!lyr && lyr.getSource() instanceof ol.source.TileWMS)
                return;

            var url = lyr.getSource().getGetFeatureInfoUrl(evt.coordinate, this.map.getView().getResolution(), this.map.getView().getProjection(), {
                'INFO_FORMAT': 'application/json'
            });

            var ajax = $.ajax({
                url: url,
                async: true,
                dataType: 'json',
                success: function (response) {
                    var features = format.readFeatures(response, {
                        dataProjection: self.crsCode,
                        featureProjection: self.crsCode
                    });

                    if (!features) {
//						self.select.getFeatures().push(features[0]);

                        if (zoom < 9) {
                            self.map.getView().setZoom(9);
                            self.map.getView().setCenter(evt.coordinate);

                            return false;
                        }
                    }
                }
            });

            if (this.props.callback) {
                ajax.done(eval(self.props.callback));
            }
        },

        getWfsProperty: function (param) {
            this.extendProps(param);
            this.offClick_Wfs();
            this.onClick_Wfs();

            this.isEditSelect = true;
        },

        offClick_Wfs: function () {
            this.map.un("click", this._onClick_Wfs, this);

            this.isEditSelect = false;
        },

        onClick_Wfs: function () {
            this.map.on("click", this._onClick_Wfs, this);
        },

        _onClick_Wfs: function (evt) {
            var self = this;
            var format = new ol.format.GeoJSON();
            var targets = self.props.target.split(",");
            $.each(targets, function (idx, t) {
                var lyr = self.getLayerById(t);

                if (!lyr) {
                    return;
                }

                self.map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
                    if (lyr == layer) {
                        var id = feature.getId();

                        if (self.props.callback) {
                            self.props.callback(feature);
                        }
                    }
                });
            });
        },

        getFeatureByKey: function (layerName, params) {
            if (!layerName)
                return {
                    features: []
                };

            var geojsonFormat = new ol.format.GeoJSON();
            var features = {
                features: []
            };

            var searchType = '';
            var searchCond = '';
            var searchWord = '';
            var recordCount = 30;
            var startIndex = 0;
            if (params.count)
                recordCount = params.count;
            if (params.startIndex)
                startIndex = params.startIndex;

            if (params.key && params.key) {
                if (!params.pattern)
                    params.pattern = "";

                switch (params.pattern.trim().toLowerCase()) {
                    case "equal":
                        searchCond = params.key;
                        searchWord = params.value;
                        break;
                    case "=":
                        searchCond = params.key;
                        searchWord = params.value;
                        break;
                    case "like":
                        searchType = 'cond';
                        searchCond = params.key;
                        searchWord = params.value;
                        break;
                    default:
                        searchCond = params.key;
                        searchWord = params.value;
                        break;
                }
            }

            $.ajax({
                url: PATH + "/map/proxy/wfs.do",
                dataType: 'json',
                async: false,
                data: {
                    request: 'GetFeature',
                    version: '1.1.1',
                    typename: layerName,
                    outputFormat: 'application/json',
                    // CQL_FILTER: sql,
                    searchType: searchType,
                    searchCond: searchCond,
                    searchWord: searchWord,
                    count: recordCount, // default 30
                    startIndex: startIndex
                    // default 0
                },
                beforeSend: function () {
                    // showLoading();
                },
                success: function (response) {
                    features = {
                        count: response.totalFeatures,
                        features: geojsonFormat.readFeatures(response)
                    }

                    if (response.totalFeatures == 0)
                        features = {
                            features: []
                        };
                },
                error: function (a, b, c) {
                    console.log("error");
                }
            });

            return features;
        },

        getPropByCoordinate: function (coord, id, ansy, callback) {
            var self = this;

            if (!coord || !id)
                return;
            if (!ansy)
                ansy = false;

            var map = this.map;
            var format = new ol.format.GeoJSON();
            var lyr = this.getLayerById(id);
            var feature;

            if (!lyr || !(lyr instanceof ol.layer.Tile)) {
                return;
            }
            var url = lyr.getSource().getGetFeatureInfoUrl(coord, map.getView().getResolution(), map.getView().getProjection(), {
                'INFO_FORMAT': 'application/json'
            });

            var ajax = $.ajax({
                url: url,
                async: ansy,
                success: function (response) {
                    if (!response)
                        return null;

                    try {
                        var features = format.readFeatures(response, {
//							dataProjection : SisMap.viewCrsCode,
                            featureProjection: self.crsCode
                        });

                        if (features) {
                            feature = features[0];
                        }

                        return feature;
                    } catch (ex) {
                        console.log(ex)
                        return null;
                    }
                }
            });

            if (callback) {
                ajax.done(eval(callback));
            }

            return feature;
        }
    }
})(window, jQuery);
