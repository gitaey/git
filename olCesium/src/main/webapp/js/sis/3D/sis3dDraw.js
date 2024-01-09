(function (window, $) {
    "use strict";

    window.Sis3DDraw = function (map) {
        this._init(map);
    };

    Sis3DDraw.prototype = {
        map: null,
        screenSpaceEventHandler: null,

        activeShapePoints: [],
        activeShape: null,
        floatingPoint: null,

        tempLine: null,

        dataSources: null,

        drawIdx: 0,

        isDrawing: false,
        preDrawMode: "",

        _init: function (map) {
            if (!map) {
                alert("지도를 설정하여주세요.");
                return false;
            }

            this.map = map;
            this.dataSources = new Cesium.CustomDataSource("drawEntity");
            this.map.viewer.dataSources.add(this.dataSources);
        },

        startDraw: function(type= "line", isMeasure = false) {
            var self = this;
            this.stopDraw(type, isMeasure);

            this.preDrawMode = type;

            this.isDrawing = true;

            this.handler = new Cesium.ScreenSpaceEventHandler(self.map.scene.canvas);

            this.handler.setInputAction(function(evt) {
                var ray = self.map.scene.camera.getPickRay(evt.position);
                // var earthPoisition = self.map.scene.globe.pick(ray, self.map.scene);

                var earthPoisition = self.map.viewer.scene.pickPosition(evt.position);

                var cthPos = self.map.scene.clampToHeight(earthPoisition);

                var pos = earthPoisition;
                if(cthPos) pos = cthPos;

                if(Cesium.defined(pos)) {
                    if(self.activeShapePoints.length === 0) {
                        self.activeShapePoints.push(pos);

                        var dynamicPositions = new Cesium.CallbackProperty(function() {
                            if(type === "polygon") {
                                return new Cesium.PolygonHierarchy(self.activeShapePoints);
                            }
                            return self.activeShapePoints;
                        }, false);

                        if(type == "polygon") {
                            self.activeShape = self.drawPolygon(dynamicPositions);
                        }
                        else {
                            self.activeShape = self.drawPolyline(dynamicPositions);
                        }

                        self.tempLine = self.drawPolyOutLine(new Cesium.CallbackProperty(function() {
                            return self.activeShapePoints;
                        }, false));
                    }

                    if(type != "polygon") self.getDistance(self.activeShape, self);
                    self.activeShapePoints.push(earthPoisition);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            // MOUSE MOVE
            this.handler.setInputAction(function(evt) {
                var ray = self.map.scene.camera.getPickRay(evt.endPosition);
                // var globePos = self.map.scene.globe.pick(ray, self.map.scene);
                var newPosition = self.map.viewer.scene.pickPosition(evt.endPosition);
                //
                // var cthPos = self.map.scene.clampToHeight(newPosition);
                //
                // var pos;
                // if(cthPos) pos = cthPos;
                // else pos = globePos;

                // if(!Cesium.defined(self.floatingPoint)) {
                //     self.floatingPoint = self.drawPoint(pos, {
                //         size: 10,
                //         color: Cesium.Color.BLUE
                //     });
                // } else {
                //     self.floatingPoint.position.setValue(pos);
                // }

                // if(self.activeShapePoints.length > 0) {
                //     if(Cesium.defined(pos)) {
                //         self.activeShapePoints.pop();
                //         self.activeShapePoints.push(pos);
                //     }
                // }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            this.handler.setInputAction(function(){
                if(isMeasure) {
                    if(type == "polygon") self.getArea(self.activeShape, self);
                    // else self.getDistance(self.activeShape, self);
                }
                self.stopDraw(type, false);
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

            this.handler.setInputAction(function(){
                self.dataSources.entities.remove(self.dataSources.entities.values[self.dataSources.entities.values.length - 1]);
                if(isMeasure){
                    if(type == "polygon") self.getArea(self.activeShape, self);
                    // else self.getDistance(self.activeShape, self);
                }
                self.endDraw(type);
            }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        },

        drawPoint: function(pos, props = {}) {
            var self = this;
            var color = props.color || Cesium.Color.RED;
            var pixelSize = props.size || 10;

            return this.dataSources.entities.add({
                name: "draw" + this.drawIdx,
                position: pos,
                point: {
                    color: color,
                    pixelSize: pixelSize,
                },
            });
        },

        drawLabel: function(pos, txt) {
            var canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 25;
            var context2D = canvas.getContext('2d');
            context2D.beginPath();
            context2D.lineWidth = 2;
            context2D.strokeStyle = "rgba(255, 0, 0, 0.7)";
            // 출발점 지정
            context2D.moveTo(25, 0);
            // 도착점 지정
            context2D.lineTo(25, 25);
            context2D.stroke();

            return this.dataSources.entities.add({
                name: "draw" + this.drawIdx,
                position: pos,
                billboard: {
                    color: Cesium.Color.RED,
                    image: canvas,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                },
                label: {
                    text: txt.toString(),
                    showBackground: true,
                    backgroundColor: new Cesium.Color(255, 0, 0, 0.8),
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    backgroundPadding: new Cesium.Cartesian2(7, 7),
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    font: '15px',
                    // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            });
        },

        drawPolygon: function(posData) {
            var shape;

            shape = this.dataSources.entities.add({
                name: "draw" + this.drawIdx,
                polygon: {
                    hierarchy: posData,
                    material: new Cesium.ColorMaterialProperty(
                        Cesium.Color.WHITE.withAlpha(0.5)
                    ),
                }
            });

            return shape;
        },

        drawPolyline: function(posData) {
            var shape;

            shape = this.dataSources.entities.add({
                name: "draw" + this.drawIdx,
                polyline: {
                    positions: posData,
                    material: Cesium.Color.RED,
                    clampToGround: true,
                    width: 2,
                }
            });

            return shape;
        },

        drawPolyOutLine: function(posData) {
            if(posData.length > 2)
                posData.push(posData[0]);

            return this.dataSources.entities.add({
                name: "draw" + this.drawIdx,
                polyline: {
                    positions: posData,
                    material: Cesium.Color.RED,
                    clampToGround: true,
                    width: 2,
                }
            });
        },

        endDraw: function(type, isMeasure) {
            this.activeShapePoints.pop();

            if(this.isDrawing) type = this.preDrawMode;

            if(type == 'polygon') {
                this.drawPolygon(this.activeShapePoints);
                this.drawPolyOutLine(this.activeShapePoints);

                if(isMeasure && this.activeShape) this.getArea(this.activeShape, this);
            } else {
                this.drawPolyline(this.activeShapePoints);
            }
            this.dataSources.entities.remove(this.floatingPoint);
            this.dataSources.entities.remove(this.activeShape);
            this.floatingPoint = undefined;
            this.activeShape = undefined;
            this.activeShapePoints = [];

            this.drawIdx++;
        },

        stopDraw: function(type, isMeasure) {
            this.endDraw(type, isMeasure);

            if(this.handler) {
                if(!this.handler.isDestroyed())
                    this.handler.destroy();
            }

            this.isDrawing = false;

            $("#calDis, #calArea, #calHeight").removeClass("active");
        },

        clearDraw: function() {
            this.dataSources.entities.removeAll();
            this.drawIdx = 0;
        },

        getDistance: function(entity, self) {
            var polyline = entity.polyline;
            var positions = polyline._positions.getValue();

            var sumDis = 0, pos;

            for (var i = 0; i < positions.length; i++) {
                pos = positions[i];

                if(positions.length == 1) {
                    self.drawLabel(pos, "출발점");
                }
                else {
                    var ellipsoidGeodesic = new Cesium.EllipsoidGeodesic();

                    if(i > 0) {
                        ellipsoidGeodesic.setEndPoints(
                            Cesium.Cartographic.fromCartesian(pos),
                            Cesium.Cartographic.fromCartesian(positions[i - 1]));

                        var distance = ellipsoidGeodesic.surfaceDistance;
                        sumDis += distance;

                        if (i == positions.length - 1) {
                            var text = "";
                            var units = "m";

                            if (distance > 999) {
                                distance = distance * 0.001;
                                units = "Km";
                            }
                            distance = distance.toFixed(2);
                            text = numberWithCommas(distance) + units + "\n";

                            if (sumDis > 999) {
                                text += numberWithCommas((sumDis * 0.001).toFixed(2)) + "Km";
                            } else {
                                text += numberWithCommas(sumDis.toFixed(2)) + "m";
                            }

                            self.drawLabel(pos, text);
                        }
                    }
                }
            }
        },

        getArea: function(entity, self) {
            if(!entity) return ;
            var polygon = entity.polygon;
            var hierarchy = polygon.hierarchy.getValue();
            var positions = hierarchy.positions;

            var coords = [];
            var arrTmp = [];

            if (positions.length > 0) {
                for (var i = 0; i < positions.length; i++) {
                    var coord = self.map.scene.globe.ellipsoid.cartesianToCartographic(positions[i]);

                    arrTmp.push([coord.longitude * (180 / Math.PI), coord.latitude * (180 / Math.PI)]);
                }

                var coord = self.map.scene.globe.ellipsoid.cartesianToCartographic(positions[0]);
                arrTmp.push([coord.longitude * (180 / Math.PI), coord.latitude * (180 / Math.PI)]);
                coords.push(arrTmp);

                polygon = turf.polygon(coords);

                var area = turf.area(polygon);
                var units = "㎡";
                if(area >= 1000000) {
                    area = area / 1000000;
                    units = "㎢";
                }
                area = area.toFixed(2).toString();
                area = numberWithCommas(area) + " " + units;

                var centerCoords = turf.pointOnFeature(polygon).geometry.coordinates;
                var center = Cesium.Cartesian3.fromDegrees(centerCoords[0], centerCoords[1]);
                var cthPos = self.map.scene.clampToHeight(center);

                var pos = center;

                if(cthPos) pos = cthPos;

                self.drawLabel(pos, area);
            }
        },

        getHeight: function(type, isMeasure) {
            var self = this;

            this.stopDraw(type, isMeasure);

            this.handler = new Cesium.ScreenSpaceEventHandler(self.map.scene.canvas);

            this.handler.setInputAction(function (click) {
                var ray = self.map.scene.camera.getPickRay(click.position);
                // var mousePosition = self.map.scene.globe.pick(ray, sis3d.scene);
                var mousePosition = self.map.viewer.scene.pickPosition(click.position);

                var cartographic = Cesium.Cartographic.fromCartesian(mousePosition);
                var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
                var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
                var lhtext = self.map.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(longitudeString, latitudeString));

                var earthPoisition = self.map.viewer.scene.pickPosition(click.position);

                var cthPos = self.map.scene.clampToHeight(earthPoisition);

                if(cthPos) mousePosition = cthPos;

                self.drawLabel(mousePosition, lhtext.toFixed(1) + "m")
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            this.handler.setInputAction(function (click) {
                self.stopDraw("", false);
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        }
    };

})(window, jQuery);

