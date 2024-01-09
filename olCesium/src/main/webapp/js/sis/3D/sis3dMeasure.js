(function (window, $) {
    "use strict";

    window.Sis3DMeasure = function (map) {
        this._init(map);
    };

    Sis3DMeasure.prototype = {
        map: null,
        screenSpaceEventHandler: null,
        drawingMode: "line",

        activeShapePoints: [],
        activeShape: null,
        floatingPoint: null,

        tempLine: null,

        dataSources: null,

        _init: function (map) {
            if (!map) {
                alert("지도를 설정하여주세요.");
                return false;
            }

            this.map = map;
            this.dataSources = new Cesium.CustomDataSource("drawEntity");
            this.map.dataSources.add(this.dataSources);
        },

        startDraw: function() {
            var self = this;

            this.handler = new Cesium.ScreenSpaceEventHandler(self.map.scene.canvas);

            this.endDraw();
            this.handler.setInputAction(function(evt) {
                var ray = self.map.scene.camera.getPickRay(evt.position);
                var earthPoisition = self.map.scene.globe.pick(ray, self.map.scene);

                if(Cesium.defined(earthPoisition)) {
                    if(self.activeShapePoints.length === 0) {
                        self.floatingPoint = self.drawPoint(earthPoisition);
                        self.activeShapePoints.push(earthPoisition);

                        var dynamicPositions = new Cesium.CallbackProperty(function() {
                            if(self.drawingMode === "polygon") {
                                return new Cesium.PolygonHierarchy(self.activeShapePoints);
                            }
                            return self.activeShapePoints;
                        }, false);

                        self.activeShape = self.drawShape(dynamicPositions);
                        self.tempLine = self.drawTempLine(new Cesium.CallbackProperty(function() {
                            return self.activeShapePoints;
                        }, false));
                    }

                    self.activeShapePoints.push(earthPoisition);
                    // self.drawPoint(earthPoisition);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            // MOUSE MOVE
            this.handler.setInputAction(function(evt) {
                if(Cesium.defined(self.floatingPoint)) {
                    var ray = self.map.scene.camera.getPickRay(evt.endPosition);
                    var newPosition = self.map.scene.globe.pick(ray, self.map.scene);

                    if(Cesium.defined(newPosition)) {
                        // self.floatingPoint.position.setValue(newPosition);
                        self.activeShapePoints.pop();
                        self.activeShapePoints.push(newPosition);
                    }
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

            this.handler.setInputAction(function(){
                self.endDraw();
                self.stopDraw();
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

            this.handler.setInputAction(function(){
                self.dataSources.entities.remove(self.dataSources.entities.values[self.dataSources.entities.values.length - 1]);
                self.endDraw();
            }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        },

        endDraw: function() {
            this.activeShapePoints.pop();
            this.drawShape(this.activeShapePoints);
            if(this.drawingMode == 'polygon') this.drawTempLine(this.activeShapePoints);
            this.dataSources.entities.remove(this.floatingPoint);
            this.dataSources.entities.remove(this.activeShape);
            this.floatingPoint = undefined;
            this.activeShapePoints = [];
        },

        drawPoint: function(pos) {
            return this.dataSources.entities.add({
                position: self.map.scene.clampToGround(pos),
                point: {
                    color: Cesium.Color.RED,
                    pixelSize: 0,
                    heightReference : Cesium.HeightReference.CLAMP_TO_GROUND,
                }
            });
        },

        drawLabel: function(pos, txt) {
            return this.dataSources.entities.add({
                position: self.map.scene.clampToGround(pos),
                text: txt,
                font: "24px Helvetica",
                fillColor: Cesium.Color.RED,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cartesian2(0.0, 10.0),
            });
        },

        drawShape: function(posData) {
            var shape;

            if(this.drawingMode == "line") {
                shape = this.dataSources.entities.add({
                    polyline: {
                        positions: posData,
                        clampToGround: true,
                        width: 2,
                    }
                });
            }
            else if(this.drawingMode == "polygon") {
                shape = this.dataSources.entities.add({
                    polygon: {
                        hierarchy: posData,
                        material: new Cesium.ColorMaterialProperty(
                            Cesium.Color.RED.withAlpha(0.2)
                        ),
                    }
                });
            }

            return shape;
        },

        drawTempLine: function(posData) {
            if(posData.length > 2)
                posData.push(posData[0]);

            return this.dataSources.entities.add({
                polyline: {
                    positions: posData,
                    material: Cesium.Color.RED,
                    clampToGround: true,
                    width: 2,
                }
            });
        },

        clearDraw: function() {
            this.dataSources.entities.removeAll();
        },

        stopDraw: function() {
            if(this.handler) {
                if(!this.handler.isDestroyed())
                    this.handler.destroy();
            }

            $("#calArea").removeClass("active");
        }
    };

})(window, jQuery);

