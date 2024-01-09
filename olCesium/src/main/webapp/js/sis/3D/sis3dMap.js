(function (window, $) {
    "use strict";

    window.Sis3D = function (map2d, props) {
        this._init(map2d, props);
    };

    Sis3D.prototype = {
        ol2d: null,
        ol3d: null,
        camera: null,
        viewer: null,
        scene: null,
        canvas: null,
        dataSources: null,
        centerPosition: {
            lon: null,
            lat: null,
            height: 0,
            roll: null,
            pitch: null,
            heading: null
        },
        vWorld: {
            vBase: null,
            vSatellite: null,
            vHybrid: null
        },
        // blockLimiter_: false,
        // boundingSphere_: null,

        _init: function (map2d, props) {
            if (!map2d) {
                alert("Map ID가 지정되지 않았습니다.");
                return false;
            }

            this.ol2d = map2d;

            this._setInitConfig(map2d, props); // 초기설정
        },

        // 초기 설정
        _setInitConfig: function (map2d, props) {
            // 속성값 설정
            this.extendProps(props);
            // 3D 지도 생성
            this._create3dMap(map2d);
            // 컨트롤러 변경
            this._setChangeControl();
            // Extent Limit 변경
            // this._setLimitExtnet();
        },

        // 속성값 설정
        extendProps: function (props) {
            this.props = $.extend({}, this.props, props);
        },

        // 3D 지도 생성
        _create3dMap: function (map2d) {

            Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiYTc4NjM2My04MTZjLTRjODctYjU2Zi1hYzhlNzc2ZWM4ZmUiLCJpZCI6MTQwMzU4LCJpYXQiOjE2ODQ3MTc1NzJ9.9E62EIjnftrH_b2sDKInio6vbvwkbq-2XyYoKNh5fpk';

            this.ol3d = new olcs.OLCesium({
                map: map2d,
            });

            this.scene = this.ol3d.getCesiumScene();
            this.scene.terrainProvider = Cesium.createWorldTerrain();
            this.ol3d.setEnabled(true);


            return ;
            this.canvas = this.ol3d._canvas;
            this.camera = this.ol3d.getCamera();

            // Center 변경
            this._setCenter();

            // Cesium globe change to BLACK
            this.scene.imageryLayers.removeAll();
            this.scene.globe.baseColor = Cesium.Color.BLACK;

            // 우주배경 visible false
            this.scene.skyBox.show = false;
            this.scene.sun.show = false;
            this.scene.moon.show = false;

            // Entity 더블클릭 마기
            this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

            // this.scene.screenSpaceCameraController._zoomFactor = 30;
            this.scene.screenSpaceCameraController._zoomFactor = 20;
            this.scene.screenSpaceCameraController.inertiaSpin  = 1;
            this.scene.screenSpaceCameraController.inertiaZoom   = 1;

            this._addVWorld();

            var scratchNormal = new Cesium.Cartesian3();
            var previousPosition = new Cesium.Cartesian3();
            var previousDirection = new Cesium.Cartesian3();
            var previousUp = new Cesium.Cartesian3();
            var previousRight = new Cesium.Cartesian3();
            var camera = this.scene.camera;

            var self = this;

            // this.viewer.scene.postUpdate.addEventListener(function() {

                // var normal = self.scene.globe.ellipsoid.geodeticSurfaceNormal(
                //     camera.position,
                //     scratchNormal
                // );

                // var dotProduct = Cesium.Cartesian3.dot(camera.direction, normal);

                // if (dotProduct >= -0) {
                //     camera.position = Cesium.Cartesian3.clone(previousPosition, camera.position);
                //     camera.direction = Cesium.Cartesian3.clone(previousDirection, camera.direction);
                //     camera.up = Cesium.Cartesian3.clone(previousUp, camera.up);
                //     camera.right = Cesium.Cartesian3.clone(previousRight, camera.right);
                // } else {
                //     previousPosition = Cesium.Cartesian3.clone(camera.position, previousPosition);
                //     previousDirection = Cesium.Cartesian3.clone(camera.direction, previousDirection);
                //     previousUp = Cesium.Cartesian3.clone(camera.up, previousUp);
                //     previousRight = Cesium.Cartesian3.clone(camera.right, previousRight);
                // }
            // });

            var rect = new Cesium.Rectangle(2.1021307198825316, 0.5645782169874046, 2.3394587243670193, 0.6777280917102821);
            // Cesium.Camera.DEFAULT_VIEW_RECTANGLE = rect;
            // this.boundingSphere_ = Cesium.BoundingSphere.fromRectangle3D(rect, Cesium.Ellipsoid.WGS84, 300); // lux mean height is 300m

            this.viewer.entities.add({
                rectangle: {
                    coordinates: rect,
                    fill: false,
                    outline: true,
                    outlineColor: Cesium.Color.WHITE,
                },
            });

            camera.moveStart.addEventListener(() => {
                jijuk.show = false;
            });

            camera.moveEnd.addEventListener(() => {
                jijuk.show = true;
            });

            var self = this;
            this.handler = new Cesium.ScreenSpaceEventHandler(this.scene.canvas);

            this.handler.setInputAction(() => {
                if(sisLayer3d.infoCondition) {
                    sisLayer3d.tileset.style = new Cesium.Cesium3DTileStyle({
                        color: "rgba(255, 255, 255, 0.1)",
                    });
                }
            }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

            this.handler.setInputAction(() => {
                if(sisLayer3d.infoCondition) {
                    sisLayer3d.tileset.style = new Cesium.Cesium3DTileStyle({
                        color: "rgba(255, 255, 255, 0)",
                    });
                }

                setTimeout(() => {
                    if($("#lsmd_cont_ldreg").hasClass("active")) jijuk.show = true;
                }, 100)
            }, Cesium.ScreenSpaceEventType.LEFT_UP);

            this.handler.setInputAction((evt) => {
                setTimeout(() => {
                    if($("#lsmd_cont_ldreg").hasClass("active")) jijuk.show = true;
                }, 100)

                // var cameraPosition = self.scene.camera.positionWC;
                // var ellipsoidPosition = self.scene.globe.ellipsoid.scaleToGeodeticSurface(cameraPosition);
                // var distance = Cesium.Cartesian3.magnitude(Cesium.Cartesian3.subtract(cameraPosition, ellipsoidPosition, new Cesium.Cartesian3()));
                // if(evt == 100) {
                //     if(distance < 150) self.scene.screenSpaceCameraController.enableZoom = false
                // }else {
                //     if(distance > 100) self.scene.screenSpaceCameraController.enableZoom = true
                // }

            }, Cesium.ScreenSpaceEventType.WHEEL);

            this.handler.setInputAction(() => {
                setTimeout(() => {
                    if($("#lsmd_cont_ldreg").hasClass("active")) jijuk.show = true;
                }, 100)
            }, Cesium.ScreenSpaceEventType.RIGHT_UP);
        },

        // Controller 변경
        _setChangeControl: function() {
            // Mouse Controller 변경
            this.scene.screenSpaceCameraController.tiltEventTypes = [
                Cesium.CameraEventType.RIGHT_DRAG, Cesium.CameraEventType.PINCH,
                {eventType: Cesium.CameraEventType.LEFT_DRAG, modifier: Cesium.KeyboardEventModifier.CTRL},
                {eventType: Cesium.CameraEventType.RIGHT_DRAG, modifier: Cesium.KeyboardEventModifier.CTRL}
            ];

            // Mouse Zoom Controller 변경
            this.scene.screenSpaceCameraController.zoomEventTypes = [
                Cesium.CameraEventType.MIDDLE_DRAG, Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH
            ];
        },

        _limitCameraToBoundingSphereRatio: function (height) {
            // return height > 3000 ? 9 : 3;
        },

        _limitCameraToBoundingSphere: function() {
            var self = this;

            if (this.boundingSphere_ && !this.blockLimiter_) {
                var position = this.scene.camera.position;
                var carto = Cesium.Cartographic.fromCartesian(position);
                var ratio = this._limitCameraToBoundingSphereRatio(carto.height);

                if (Cesium.Cartesian3.distance(this.boundingSphere_.center, position) > this.boundingSphere_.radius) {
                    var currentlyFlying = camera.flying;

                    if (currentlyFlying === true) {
                        // There is a flying property and its value is true
                        return;
                    } else {
                        this.blockLimiter_ = true;

                        var unblockLimiter = function unblockLimiter() {
                            return self.blockLimiter_ = false;
                        };

                        camera.flyToBoundingSphere(this.boundingSphere_, {
                            complete: unblockLimiter,
                            cancel: unblockLimiter
                        });
                    }
                }
            }
        },

        _setLimitExtnet: function() {

            this.viewer.camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z;

            // Max Zoom Level
            this.scene.screenSpaceCameraController.maximumZoomDistance = 360000;
            // Min Zoom Level
            // this.scene.screenSpaceCameraController.minimumZoomDistance = 100;

            var self = this;
            var obj = document.querySelector("#compassObj");

            // var cartographic = new Cesium.Cartographic();
            // var camera = this.viewer.scene.camera;
            // var ellipsoid = this.viewer.scene.mapProjection.ellipsoid;

            this.scene.camera.percentageChanged = 0.01;
            this.scene.camera.changed.addEventListener(function() {
                var pos = self.viewer.camera.position;

                // 나침반
                obj.contentDocument.querySelector("svg").style.transform = 'rotate(' + self.viewer.camera.heading + 'rad)';

                var windowPosition = new Cesium.Cartesian2(self.viewer.container.clientWidth / 2, self.viewer.container.clientHeight / 2);
                var pickRay = self.viewer.scene.camera.getPickRay(windowPosition);
                var pickPosition = self.viewer.scene.globe.pick(pickRay, self.scene);


                if(pickPosition) {

                    var pickPositionCartographic = self.viewer.scene.globe.ellipsoid.cartesianToCartographic(pickPosition);
                    var lon = (pickPositionCartographic.longitude * (180 / Math.PI)).toFixed(4);
                    var lat = (pickPositionCartographic.latitude * (180 / Math.PI)).toFixed(4);
                    var height = pickPositionCartographic.height

                    $("#centerPos").text(`${lon} / ${lat}`);
                }

            });
        },

        _setCenter: function() {
            // 화면공유용
            // if(hasParameterByName("share")) {
            //     this.viewer.camera.setView({
            //         destination: new Cesium.Cartesian3.fromDegrees(
            //             parseFloat(getParameterByName("lon")),
            //             parseFloat(getParameterByName("lat")),
            //             parseFloat(getParameterByName("height"))),
            //         orientation: {
            //             heading: parseFloat(getParameterByName("height")),
            //             pitch: parseFloat(getParameterByName("pitch")),
            //             roll: parseFloat(getParameterByName("roll"))
            //         }
            //     });
            // }else {
                // 전라남도청 위치
            // this.ol2d.getView().setCenter(ol.proj.transform([126.46407823345542, 34.81628129322431], "EPSG:4326", "EPSG:3857"));
            //     this.viewer.getCamera().setView({
            //         destination: new Cesium.Cartesian3.fromDegrees( 126.46407823345542, 34.81628129322431, 14000),
            //     });
            // }

        },

        _addVWorld: function(visible, map) {

            var layers = {
                Base: {layer : 'Base', tileType : 'png'},
                Gray: {layer : 'gray', tileType : 'png'},
                Midnight: {layer : 'midnight', tileType : 'png'},
                Hybrid: {layer : 'Hybrid', tileType : 'png'},
                Satellite: {layer : 'Satellite', tileType : 'jpeg'}
            }

            var vBase = new Cesium.WebMapTileServiceImageryProvider({
                // url: PATH + `/map/proxy/proxyBackground.do?x={TileCol}&y={TileRow}&z={TileMatrix}&type=vworld`,
                url: 'https://api.vworld.kr/req/wmts/1.0.0/C37002D3-933A-3103-95BE-769E488A80E5/Base/{TileMatrix}/{TileRow}/{TileCol}.png',
                layer : layers["Base"].layer,
                tileMatrixSetID: 'layers["Base"].layer',
                style : 'default',
                maximumLevel: 19,
                credit : new Cesium.Credit('VWorld Korea')
            });

            var vSatellite = new Cesium.WebMapTileServiceImageryProvider({
                // url: PATH + `/map/proxy/proxyBackgroundSatellite.do?x={TileCol}&y={TileRow}&z={TileMatrix}&type=vworld`,
                url: 'https://api.vworld.kr/req/wmts/1.0.0/C37002D3-933A-3103-95BE-769E488A80E5/Satellite/{TileMatrix}/{TileRow}/{TileCol}.jpeg',
                layer : layers["Satellite"].layer,
                tileMatrixSetID: 'layers["Satellite"].layer',
                style : 'default',
                maximumLevel: 19,
                credit : new Cesium.Credit('VWorld Korea')
            });

            var vHybrid = new Cesium.WebMapTileServiceImageryProvider({
                // url: PATH + `/map/proxy/proxyBackgroundHybrid.do?x={TileCol}&y={TileRow}&z={TileMatrix}&type=vworld`,
                url: 'https://api.vworld.kr/req/wmts/1.0.0/C37002D3-933A-3103-95BE-769E488A80E5/Hybrid/{TileMatrix}/{TileRow}/{TileCol}.png',
                layer : layers["Satellite"].layer,
                tileMatrixSetID: 'layers["Satellite"].layer',
                style : 'default',
                maximumLevel: 19,
                credit : new Cesium.Credit('VWorld Korea')
            });

            this.vWorld.vBase = new Cesium.ImageryLayer(vBase);
            this.vWorld.vSatellite = new Cesium.ImageryLayer(vSatellite);
            this.vWorld.vHybrid = new Cesium.ImageryLayer(vHybrid);

            this.scene.imageryLayers.add(this.vWorld.vBase);
            // this.vWorld.vBase.show = false;

            this.scene.imageryLayers.add(this.vWorld.vSatellite);
            this.vWorld.vSatellite.show = false;
            this.scene.imageryLayers.add(this.vWorld.vHybrid)
            this.vWorld.vHybrid.show = false;
        },

        changeBaseMap: function(id) {
            switch(id) {
                case 'vworldMap':
                        this.vWorld.vBase.show = true;
                        this.vWorld.vSatellite.show = false;
                        this.vWorld.vHybrid.show = false;
                    break;

                case 'hybridMap':
                        this.vWorld.vBase.show = false;
                        this.vWorld.vSatellite.show = true;
                        this.vWorld.vHybrid.show = true;
                    break;

                default:
                    return;
            }
        },

        resetCamera: function() {
            var windowPosition = new Cesium.Cartesian2(this.viewer.container.clientWidth / 2, this.viewer.container.clientHeight / 2);
            var pickRay = this.viewer.scene.camera.getPickRay(windowPosition);
            var pickPosition = this.viewer.scene.globe.pick(pickRay, this.viewer.scene);
            var pickPositionCartographic = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(pickPosition);
            var apilon = pickPositionCartographic.longitude * (180 / Math.PI);
            var apilat = pickPositionCartographic.latitude * (180 / Math.PI);

            console.log(apilon + " : " + apilat);
            var currentPosition = this.viewer.camera.positionCartographic;

            var pos = Cesium.Cartesian3.fromDegrees(apilon, apilat, currentPosition.height);

            this.viewer.camera.flyTo({
                destination: pos,
                orientation: {
                    heading: 0,
                    pitch: -1.5705708782821275,
                    roll: 0
                }
            });
        },

        zoomIn: function() {
            const cameraHeight = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
                this.scene.camera.position
            ).height;
            if(parseInt(cameraHeight) > 1000) {
                this.scene.camera.moveForward(1000);
            }else {
                if(parseInt(cameraHeight) > 100) {
                    this.scene.camera.moveForward(100);
                }
            }
        },

        zoomOut: function() {
            const cameraHeight = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
                this.scene.camera.position
            ).height;
            if(parseInt(cameraHeight) < 91000 && parseInt(cameraHeight) >= 1000) {
                this.scene.camera.moveBackward(1000);
            }else {
                if(parseInt(cameraHeight) >= 10 && parseInt(cameraHeight) < 1000) {
                    this.scene.camera.moveBackward(100);
                }
            }
        }
    };

})(window, jQuery);

