(function (window, $) {
    window.SisMeasure = function (map) {
        if (!map) {
            alert("Measure map을 지정하해 주세요");
            return false;
        }

        this.map = map;
        this._init();
    };

    SisMeasure.prototype = {
        continueMsg: '계속 그리시려면 화면을 클릭하세요.<br>중지하시려면 더블클릭하세요',
        overlayClassName: "ol-tooltip ol-tooltip-static",
        overlayViewClassName: "ol-tooltip",

        isHelpTooltip: true,
        isMeasureTooltip: true,
        isStop: false,

        // wgs84Sphere: new ol.Sphere(6378137),

        parent: parent,

        control: {
            measure: null
        },

        measureLayer: null,

        _init: function (option) {
            this.measureLayer = new ol.layer.Vector({
                name: "measureLayer",
                id: "measureLayer",
                source: new ol.source.Vector(),
                projection: this.map.getView().getProjection().getCode(),
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: "rgba(255, 255, 255, 0.5)",
                    }),
                    stroke: new ol.style.Stroke({
                        color: "red",
                        width: 2,
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: "#ffcc33",
                        }),
                    }),
                }),
            });

            this.map.addLayer(this.measureLayer);

            window.sisMeasure = this;
        },

        setMeasureType: function (type) {
            var self = this;

            this.type = type;

            this.control.measure = new ol.interaction.Draw({
                source: this.measureLayer.getSource(),
                type: type,
                dragVertexDelay: 100,
                wrapX: true,
                condition: function (evt) {
                    if (evt.originalEvent.buttons === 2) {
                        self.stopMeasure();

                        self.map.set("contextMenu", false);
                        setTimeout(function() {
                            self.map.set("contextMenu", true);
                        }, 1000);

                        return false;
                    } else return true;
                },
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: "rgba(255, 255, 255, 0.2)",
                    }),
                    stroke: new ol.style.Stroke({
                        color: "rgba(255, 0, 0, 0.8)",
                        lineDash: [10, 10],
                        width: 2,
                    }),
                    image: new ol.style.Circle({
                        radius: 5,
                        stroke: new ol.style.Stroke({
                            color: "rgba(0, 0, 0, 0.7)",
                        }),
                        fill: new ol.style.Fill({
                            color: "rgba(255, 255, 255, 0.2)",
                        }),
                    }),
                }),
            });
        },

        startMeasure: function (type, isHelpTooltip, isMeasureTooltip, isStop) {
            var self = this;

            if (isHelpTooltip) this.isHelpTooltip = true;
            if (isMeasureTooltip) this.isMeasureTooltip = true;

            if (this._overlayEvent) this.map.un(this._overlayEvent);
            this.map.removeOverlay(this.overlayLayer);

            this._clear();
            this.isMeasure = true;
            this.setMeasureType(type);
            this.measureFeature = null;

            // 지도 contextMenu 방지
            this.map.set("contextMenu", false);

            this.measureFeatures = this.measureLayer.getSource().getFeatures();
            var control = this.control.measure;
            this.map.removeInteraction();
            this.map.addInteraction(control);

            if (this.isMeasureTooltip) this._createMeasureTooltip();

            if (this.isHelpTooltip) this._createHelpTooltip();

            control.on(
                "drawstart",
                function (evt, e) {
                    if (isStop) self._clear();
                    self.measureFeature = evt.feature;
                },
                this
            );

            control.on(
                "drawend",
                function (evt, e) {
                    if (self.isMeasureTooltip) {
                        self.clickIdx = -1;

                        if (type === "LineString") {
                            $(".ol-tooltip.creating").removeClass("creating");
                            self.map.removeOverlay(self.overlayLayer);

                            self.measureFeature = null;
                            self.overlayLayer = null;
                            self._createMeasureTooltip();
                        } else if (type === "Circle") {
                            $(".ol-tooltip.creating").removeClass("creating");
                            self.overlayLayer.setOffset([0, -7]);

                            self.measureFeature = null;
                            self.overlayLayer = null;
                            self._createMeasureTooltip();

                            self.radiusLineFeature = null;
                        } else {
                            var length = self.measureFeature.getGeometry().getCoordinates()[0].length;
                            var geoms = self.measureFeature.getGeometry().getCoordinates()[0];
                            var lineString = new ol.geom.LineString(geoms);
                            self.overlayElement.firstElementChild.innerHTML = self._calculateDistance(lineString);

                            self.overlayLayer.setPosition(self.measureFeature.getGeometry().getCoordinates()[0][length - 1]);

                            self._createMeasureTooltip();

                            $(".ol-tooltip.creating").removeClass("creating");
                            //self.map.removeOverlay(self.overlayLayer);

                            self.overlayElement.className = self.overlayClassName;
                            self.overlayLayer.setOffset([0, -7]);

                            var geom = self.measureFeature.getGeometry();
                            var output = self._calculateArea(geom);
                            var coord = geom.getInteriorPoint().getCoordinates();

                            self.overlayElement.firstElementChild.innerHTML = output;
                            self.overlayLayer.setPosition(coord);

                            self.measureFeature = null;
                            self.overlayLayer = null;
                            self._createMeasureTooltip();
                        }
                    }

                    if (isStop) self._clear();
                },
                self
            );
            //
            this.pointermoveKey = this.map.on("pointermove", function(evt) {self._pointerMove(evt, self)});
            //if (type === "LineString") self.map.on("click", self._singleClick);
            this.singleClickKey = this.map.on("click", function(evt) {self._singleClick(evt, self)});
            $("canvas").on("mouseout", this._hideTooltip);
        },

        _rightClick: function (evt) {
            evt.preventDefault();
            this._clear();
            this.stopMeasure();
        },

        // 지도클릭 이벤트
        _singleClick: function (evt, self) {
            if (self.isMeasureTooltip) {
                self.clickIdx++;

                if (self.clickIdx > 1) {
                    self.overlayElement.className += "creating";
                    self.overlayLayer.setOffset([0, -7]);

                    if (self.type === "LineString") {
                        var length = self.measureFeature.getGeometry().getCoordinates().length;
                        self.overlayLayer.setPosition(self.measureFeature.getGeometry().getCoordinates()[length - 2]);
                    } else {
                        var length = self.measureFeature.getGeometry().getCoordinates()[0].length;
                        // console.log(length);
                        var geoms = self.measureFeature
                            .getGeometry()
                            .getCoordinates()[0]
                            .slice(0, length - 2);
                        var lineString = new ol.geom.LineString(geoms);
                        self.overlayElement.firstElementChild.innerHTML = self._calculateDistance(lineString);

                        self.overlayLayer.setPosition(self.measureFeature.getGeometry().getCoordinates()[0][length - 2]);
                    }

                    self.overlayLayer = null;
                    self._createMeasureTooltip();
                }
            }
        },

        _pointerMove: function (evt, self) {
            if (evt.dragging || evt.originalEvent.target.tagName !== "CANVAS") {
                return;
            }

            $("div.ol-tooltip").not($(".tooltip-static")).show();

            /** @type {string} */
            var helpMsg = "화면 클릭시 그리기를 시작합니다<br/>우측 마우스 버튼 클릭시 그리기를 종료합니다";
            /** @type {ol.Coordinate|undefined} */
            var tooltipCoord = evt.coordinate;

            if (self.measureFeature) {
                var output;
                var geom = self.measureFeature.getGeometry();
                if (geom instanceof ol.geom.Polygon) {
                    output = self._calculateArea(geom);
                    helpMsg = self.continueMsg;
                    tooltipCoord = geom.getInteriorPoint().getCoordinates();
                } else if(geom instanceof ol.geom.Circle) {
                    output = self._calculateRadius(geom);
                    helpMsg = self.continueMsg;
                    tooltipCoord = evt.coordinate;

                    if(!self.radiusLineFeature) {
                        self.radiusLineFeature = new ol.Feature({
                            geometry: new ol.geom.LineString([geom.getCenter(), evt.coordinate])
                        });

                        self.measureLayer.getSource().addFeature(self.radiusLineFeature);
                    } else {
                        self.radiusLineFeature.getGeometry().setCoordinates([self.radiusLineFeature.getGeometry().getFirstCoordinate(), evt.coordinate]);
                    }

                } else if (geom instanceof ol.geom.LineString) {
                    output = self._calculateDistance(geom);
                    helpMsg = self.continueMsg;
                    tooltipCoord = geom.getLastCoordinate();
                }

                if (self.isMeasureTooltip) {
                    //this.overlayElement.innerHTML = output;
                    //if (this.overlayLayer) {
                    self.overlayElement.firstElementChild.innerHTML = output;
                    self.overlayLayer.setPosition(tooltipCoord);
                    //}
                }
            }

            if (self.isHelpTooltip) {
                self.overlayViewElement.innerHTML = helpMsg;
                self.overlayViewLayer.setPosition(evt.coordinate);
            }
        },

        _calculateDistance: function (line) {
            var length = ol.sphere.getLength(line);

            var output;
            if (length > 100) {
                output = Math.round((length / 1000) * 100) / 100 + " km";
            } else {
                output = Math.round(length * 100) / 100 + " m";
            }
            return output;
        },

        _calculateArea: function (polygon) {
            var area = ol.sphere.getArea(polygon);

            var output;
            if (area > 10000) {
                output = Math.round((area / 1000000) * 100) / 100 + " " + "km<sup>2</sup>";
            } else {
                output = Math.round(area * 100) / 100 + " m<sup>2</sup>";
            }
            return output;
        },

        _calculateRadius: function(circle) {
            var radius = circle.getRadius();

            var output;
            if (radius > 100) {
                output = Math.round((radius / 1000) * 100) / 100 + " km";
            } else {
                output = Math.round(radius * 100) / 100 + " m";
            }
            return output;
        },

        _createMeasureTooltip: function (className) {
            this.overlayElement = document.createElement("div");
            var spanElement = document.createElement("span");
            var closeElement = document.createElement("span");
            closeElement.className = "close";
            closeElement.innerHTML = " X";

            this.overlayElement.appendChild(spanElement);
            this.overlayElement.appendChild(closeElement);

            closeElement.onclick = (evt) => {
                $(evt.target).closest(".ol-tooltip-static").remove();
            };

            this.overlayElement.className = this.overlayClassName + " " + className;

            this.overlayLayer = new ol.Overlay({
                element: this.overlayElement,
                id: "measure",
                offset: [0, -20],
                stopEvent: false,
                positioning: "bottom-center",
            });
            this.map.addOverlay(this.overlayLayer);
        },

        _createHelpTooltip: function (className = "") {
            this.overlayViewElement = document.createElement("div");
            this.overlayViewElement.className = this.overlayViewClassName + " " + className;
            this.overlayViewLayer = new ol.Overlay({
                element: this.overlayViewElement,
                id: "measure",
                offset: [25, 0],
                stopEvent: false,
                positioning: "center-left",
            });
            this.map.addOverlay(this.overlayViewLayer);
        },

        _hideTooltip: function (evt, test) {
            $("canvas").on("mouseout", function () {
                $("div.ol-tooltip").not($(".ol-tooltip-static")).hide();
            });
        },

        _removeTooltip: function () {
            $("div.ol-tooltip").not($(".ol-tooltip-static")).remove();
        },

        _allClear: function () {
            this.measureLayer.getSource().clear();
            // this.map.removeLayer(this.measureLayer);
            // this.map.removeEventListener("pointermove", this._pointerMove);
            // this.map.removeEventListener("click", this._singleClick);

            ol.Observable.unByKey(this.pointermoveKey);
            ol.Observable.unByKey(this.singleClickKey);

            this.map.removeInteraction(this.control.measure);

            var overlayers = this.map.getOverlays().getArray();
            var removeItems = [];
            overlayers.forEach((item, idx) => {
                if (item.getId() === "measure") {
                    removeItems.push(item);
                }
            });

            removeItems.forEach((item, idx) => {
                this.map.removeOverlay(item);
            });

            this.isMeasure = false;

            this.droneFeature = new ol.Feature();
            this.droneProps = {
                area: 0,
                geom: "",
            };

            this.map.set("contextMenu", true);
        },

        _clear: function () {
            // this.map.removeEventListener("pointermove", this._pointerMove);
            // this.map.removeEventListener("click", this._singleClick);

            ol.Observable.unByKey(this.pointermoveKey);
            ol.Observable.unByKey(this.singleClickKey);

            $("canvas").unbind("mouseout", this._hideTooltip);

            this._removeTooltip();

            this.clickIdx = 0;

            this.map.removeInteraction(this.control.measure);

            if(this.overlayViewLayer) {
                this.map.removeOverlay(this.overlayViewLayer);
                this.overlayViewLayer = null;
            }

            if (this.overlayLayer) {
                this.map.removeOverlay(this.overlayLayer);
                this.overlayLayer = null;
                $(".ol-tooltip.creating").remove();
            }

            $("div.measure-tooltip").not($(".tooltip-static")).css({
                display: "none",
            });
            this.isMeasure = false;

            this.droneFeature = new ol.Feature();
            this.droneProps = {
                area: 0,
                geom: "",
            };

            this.map.set("contextMenu", true);
        },

        stopMeasure: function () {
            this._clear();
        },
    }

})(window, jQuery);