/**
 * Openlayers 그리기 관련 javascript
 * map 객체를 반드시 매개변수로 받아야함
 * */
(function (window, $) {
    window.SisCreator = function (map) {
        if (!map) {
            alert("Creator map 객체를 지정해 주세요");
            return false;
        }

        this.map = map;
        this._init();
    };

    SisCreator.prototype = {
        drawControl: null, // Interaction
        drawSource: new ol.source.Vector(),
        drawStyle: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.5)'
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(255, 0, 0, 0.5)',
                // lineDash: [10, 10],
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 5,
                fill: new ol.style.Fill({
                    color: 'rgba(255, 0, 0, 1)'
                })
            })
        }),

        drawLayer: null,

        // init
        _init: function () {
            this.drawLayer = new ol.layer.Vector({
                name: "drawLayer",
                id: "drawLayer",
                source: this.drawSource,
                projection: this.map.getView().getProjection().getCode(),
                style: this.drawStyle,
                zIndex: 999
            });

            this.map.addLayer(this.drawLayer);

            window.sisCreator = this;
        },

        // Intercation 추가
        addInteraction: function () {
            var self = this;

            this.drawControl.condition_ = function (evt) {
                if (evt.originalEvent.buttons === 2) {
                    self.stop();
                } else return true;
            };

            this.map.addInteraction(this.drawControl);
        },

        // Interaction 제거
        removeInteraction: function () {
            this.map.removeInteraction(this.drawControl);
        },

        // 그리기 중단
        stop: function () {
            this.removeInteraction();
        },

        // 초기화
        clear: function () {
            this.drawSource.clear();
            this.stop();
        },

        // 포인트 그리기
        createPoint: function () {
            this.removeInteraction();

            this.drawControl = new ol.interaction.Draw({
                source: this.drawSource,
                type: "Point",
                style: this.drawStyle
            });

            this.addInteraction();

            return this.drawControl;
        },

        // 라인 그리기
        createLine: function () {
            this.removeInteraction();

            this.drawControl = new ol.interaction.Draw({
                source: this.drawSource,
                type: "LineString",
                style: this.drawStyle
            });

            this.addInteraction();

            return this.drawControl;
        },

        // 폴리곤 그리기
        createPolygon: function () {
            this.removeInteraction();

            this.drawControl = new ol.interaction.Draw({
                source: this.drawSource,
                type: "Polygon",
                style: this.drawStyle
            });

            this.addInteraction()

            return this.drawControl;
        },

        // 정삼각형
        createTriangle: function () {
            this.removeInteraction();

            this.drawControl = new ol.interaction.Draw({
                source: this.drawSource,
                type: "Circle",
                geometryFunction: ol.interaction.Draw.createRegularPolygon(3),
            });

            this.addInteraction();

            return this.drawControl;
        },

        // 정사각형
        createSquare: function () {
            this.removeInteraction();

            this.drawControl = new ol.interaction.Draw({
                source: this.drawSource,
                type: "Circle",
                geometryFunction: ol.interaction.Draw.createRegularPolygon(4),
            });

            this.addInteraction();

            return this.drawControl;
        },

        // 직사각형 그리기
        createBox: function () {
            this.removeInteraction();

            this.drawControl = new ol.interaction.Draw({
                source: this.drawSource,
                type: 'Circle',
                geometryFunction: ol.interaction.Draw.createBox(),
                style: this.drawStyle
            });

            this.addInteraction();

            return this.drawControl;
        },

        /**
         * 이미지 아이콘 생성한다
         * @param imgPath {string} 이미지 경로 매개변수로 받아야함
         */
        createImage: function (imgPath) {
            this.removeInteraction();

            this.drawControl = new ol.interaction.Draw({
                source: this.drawSource,
                type: 'Point',
                style: new ol.style.Style({
                    image: new ol.style.Icon({
                        opacity: 0.95,
                        src: PATH + imgPath,
                    })
                })
            });

            this.addInteraction();

            return this.drawControl;
        },

        // 원 그리기
        createCircle: function () {
            this.removeInteraction();

            this.drawControl = new ol.interaction.Draw({
                source: this.drawSource,
                type: "Circle",
                style: this.drawStyle
            });

            this.addInteraction();

            return this.drawControl;
        },

        // 별
        createStar: function () {
            this.removeInteraction();

            this.drawControl = new ol.interaction.Draw({
                source: this.drawSource,
                type: "Circle",
                geometryFunction: this.geometryFunction,
            });

            this.addInteraction();

            return this.drawControl;
        },

        /**
         * 별 그리기 지오메트리 관련 함수
         * @param coordinates {double[]} 좌표
         * @param geometry {ol.geom} 지오메트리
         * */
        geometryFunction: function (coordinates, geometry) {
            var center = coordinates[0];
            var last = coordinates[1];
            var dx = center[0] - last[0];
            var dy = center[1] - last[1];
            var radius = Math.sqrt(dx * dx + dy * dy);
            var rotation = Math.atan2(dy, dx);
            var newCoordinates = [];
            var numPoints = 12;
            for (var i = 0; i < numPoints; ++i) {
                var angle = rotation + (i * 2 * Math.PI) / numPoints;
                var fraction = i % 2 === 0 ? 1 : 0.5;
                var offsetX = radius * fraction * Math.cos(angle);
                var offsetY = radius * fraction * Math.sin(angle);
                newCoordinates.push([center[0] + offsetX, center[1] + offsetY]);
            }
            newCoordinates.push(newCoordinates[0].slice());
            if (!geometry) {
                geometry = new ol.geom.Polygon([newCoordinates]);
            } else {
                geometry.setCoordinates([newCoordinates]);
            }
            return geometry;
        },

        /**
         * 텍스트 추가
         * @param text {string} 나타낼 내용
         * @param size {int} 텍스트 크기
         * @param color {string} 텍스트 색상
         * */
        createText: function (text, size, color) {
            this.removeInteraction();

            this.drawControl = new ol.interaction.Draw({
                source: this.drawSource,
                type: "Point",
            });

            this.drawControl.on("drawend", function (evt) {
                const feature = evt.feature;

                color = $("#drawColorPicker").val();
                text = $("#drawTextLabel").val() ? $("#drawTextLabel").val() : "텍스트 입력";
                size = $("#drawTextSize").val();

                const style = new ol.style.Style({
                    text: new ol.style.Text({
                        font: size + "pt Calibri,sans-serif",
                        fill: new ol.style.Fill({color: color}),
                        stroke: new ol.style.Stroke({
                            color: "#fff",
                            width: 2,
                        }),
                        text: text,
                    }),
                });

                feature.setStyle(style);
            });

            this.addInteraction();
        },

        // 객체 삭제시작
        deleteItem: function () {
            var self = this;

            this.stop();
            this.deleteClickKey = this.map.on("click", function (evt) {
                self.delete(evt, self)
            });
        },

        // 객체 삭제종료
        stopDelete: function () {
            this.stop();
            ol.Observable.unByKey(this.deleteClickKey);
        },

        delete: function (evt, self) {
            const fs = self.map.getFeaturesAtPixel(
                evt.pixel,
                // (fs) => {
                // 	self.vectorLayer.getSource().removeFeature(fs[0]);
                // 	evt.preventDefault();
                // },
                {
                    layerFilter: (layer) => {
                        return layer === self.drawLayer;
                    },
                }
            );

            if (fs.length > 0) self.drawLayer.getSource().removeFeature(fs[0]);
        },


        /**
         * 마우스 오버레이를 생성한다
         * @param id {string} 오버레이 id
         * @param msg {string} 오버레이에 나타낼 내용
         * @param x {double} x 좌표
         * @param y {double} y 좌표
         * */
        createMouseOverlay: function (id, msg, x, y) {
            this.removeMouseOverlay();
            var self = this;
            var $ele = $("<div id='" + id + "'>" + msg + "</div>");
            $ele.addClass("overlay-tooltip");

            if (!x) x = 0;
            if (!y) y = 0;

            this.overlayLayer = new ol.Overlay({
                id: "mouseOverlay_" + id,
                element: $ele[0],
                offset: [x, y],
                positioning: 'center-left'
            });
            this.map.addOverlay(this.overlayLayer);

            this.map.un(this._overlayEvent);
            this._overlayEvent = this.map.on('pointermove', function (evt) {
                self._mouseOverlayPointerMove(evt);
            }, this);

            return this.overlayLayer;
        }
        ,

        _mouseOverlayPointerMove: function (evt) {
            var coord = evt.coordinate;
            this.overlayLayer.setPosition(coord);
        }
        ,

        removeMouseOverlay: function () {
            this.map.un(this._overlayEvent);
            this.map.removeOverlay(this.overlayLayer);
        }
        ,
    }

})(window, jQuery);