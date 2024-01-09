(function (window, $) {
    "use strict";

    window.Sis3DLayer = function (map) {
        this._init(map);
    };

    Sis3DLayer.prototype = {
        map: null,
        loadPrim: {},
        feature: {
            pickedFeature: null
        },
        infoCondition: false,
        tileset: "",

        _init: function (map) {
            if (!map) {
                alert("지도를 설정하여주세요.");
                return false;
            }

            this.map = map;

        },

        addBuldFromAsset: async function(name, assetId) {

            var tileset, clickHandler;
            var self = this;

            tileset = await Cesium.Cesium3DTileset.fromIonAssetId(assetId,
                {
                    classificationType: Cesium.ClassificationType.CESIUM_3D_TILE
                });

            tileset.style = new Cesium.Cesium3DTileStyle({
                color: "rgba(255, 255, 255, 0)",
            });

            this.tileset = tileset;

            this.map.scene.primitives.add(tileset);
            this.loadPrim[name + "_asset"] = tileset;

            clickHandler = this.map.viewer.screenSpaceEventHandler.getInputAction(
                Cesium.ScreenSpaceEventType.LEFT_CLICK
            );

            if (Cesium.PostProcessStageLibrary.isSilhouetteSupported(this.map.scene)) {

                this.map.viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
                    console.log(movement.position);
                    window.mouseClickPos = movement;

                    if(self.infoCondition) {

                        if(self.feature["pickedFeature"] != null) {
                            const tmpPickedFeature = self.map.scene.pick(movement.position);
                            if(tmpPickedFeature instanceof Cesium.Cesium3DTileFeature) {
                                self.feature["pickedFeature"].color = new Cesium.Color(1, 1, 1, 0.1);
                            }

                        }
                        const pickedFeature = self.map.scene.pick(movement.position);

                        if(pickedFeature instanceof Cesium.Cesium3DTileFeature) {
                            self.feature["pickedFeature"] = pickedFeature;
                            self.feature["pickedFeature"].color = new Cesium.Color(1, 0, 0, 0.5);
                            var sigCd = self.feature["pickedFeature"].getProperty("SIG_CD");        // 시군구 코드
                            var emdCd = self.feature["pickedFeature"].getProperty("EMD_CD");        // 읍면동 코드
                            var liCd = self.feature["pickedFeature"].getProperty("LI_CD");          // 리 코드
                            var mntnYn = self.feature["pickedFeature"].getProperty("MNTN_YN") == '0' ? '1' : '2';      // 산 여부
                            var lnbrMnnm = String(self.feature["pickedFeature"].getProperty("LNBR_MNNM")).lpad(4, '0');  // 본번
                            var lnbrSlno = String(self.feature["pickedFeature"].getProperty("LNBR_SLNO")).lpad(4, '0');  // 부번
                            var buldNm = self.feature["pickedFeature"].getProperty("BULD_NM");      // 건축물대장건물명
                            var buldNmDc = self.feature["pickedFeature"].getProperty("BULD_NM_DC"); // 상세건물명
                            var bdtypCd = self.feature["pickedFeature"].getProperty("BDTYP_CD"); // 건물용도코드
                            var groFloCo = self.feature["pickedFeature"].getProperty("GRO_FLO_CO"); // 지상층수
                            var undFloCo = self.feature["pickedFeature"].getProperty("UND_FLO_CO"); // 지하층수
                            var ntfcDe = self.feature["pickedFeature"].getProperty("NTFC_DE"); // 고시일자
                            var posBulNm = self.feature["pickedFeature"].getProperty("POS_BUL_NM"); // 시군구용 건물명
                            var bulDpnSe = self.feature["pickedFeature"].getProperty("BUL_DPN_SE"); // 건물종속여부
                            var buldSeCd = self.feature["pickedFeature"].getProperty("BULD_SE_CD"); // 건물구분코드


                            // $(".modal-body").html("건축물번호 : " + self.feature["pickedFeature"].getProperty("BD_MGT_SN"));
                            // console.log(sigCd + emdCd + liCd + mntnYn + lnbrMnnm + lnbrSlno, buldNm + " " + buldNmDc);

                            $(".modal-body").html(
                                `<table class="modal-info-tbl">
                                        <colgroup>
                                            <col width="200px"/>
                                            <col/>
                                        </colgroup>
                                        <tr>
                                            <th>주소</th>
                                            <td>${self.getCodeName("JIJUK", sigCd + emdCd + liCd) + " " + lnbrMnnm + "-" + lnbrSlno}</td>
                                        </tr>
                                    </table>
                                    <table class="modal-info-tbl">
                                        <tr>
                                            <th colspan="2">건축물명칭</th>
                                            <th colspan="2">동명칭/번호</th>
                                            <th>건물구분</th>
                                        </tr>
                                        <tr>
                                            <td colspan="2">${buldNm ? buldNm : "-"}</td>
                                            <td colspan="2">${buldNmDc ? buldNmDc : "-"}</td>
                                            <td>${buldSeCd ? self.getCodeName("BULD_SE_CD", buldSeCd) : "-"}</td>
                                        </tr>
                                        <tr>
                                            <th>건물용도</th>
                                            <th>지상층수</th>
                                            <th>지하층수</th>
                                            <th>고시일자</th>
                                            <th>기타건축물명</th>
                                        </tr>
                                        <tr>
                                            <td>${bdtypCd ? self.getCodeName("BDTYP_CD", bdtypCd) : "-"}</td>
                                            <td>${groFloCo ? groFloCo : "-"}</td>
                                            <td>${undFloCo ? undFloCo : "-"}</td>
                                            <td>${ntfcDe ? ntfcDe.substring(0, 4) + "-" + ntfcDe.substring(4, 6) + "-" + ntfcDe.substring(6, 8) : "-"}</td>
                                            <td>${posBulNm ? posBulNm : "-"}</td>
                                        </tr>
                                    </table>`
                            );

                            // Modal Show
                            $("#info-modal").show();

                        }

                        if (!Cesium.defined(self.feature["pickedFeature"])) {
                            clickHandler(movement);
                            return;
                        }
                    }

                        sisLayer3d.tileset.style = new Cesium.Cesium3DTileStyle({
                            color: "rgba(255, 255, 255, 0)",
                        });

                        if (Cesium.defined(self.feature["pickedFeature"])) self.feature["pickedFeature"].color = new Cesium.Color(1, 1, 1, 0);
                },
                Cesium.ScreenSpaceEventType.LEFT_CLICK);
            }
        },

        removePickedFeatureColor: function() {
            if(this.feature["pickedFeature"] != null) this.feature["pickedFeature"].color = new Cesium.Color(1, 1, 1, 0.1);
        },

        addDroneModel: async function(name) {
            const droneTileset = await Cesium.Cesium3DTileset.fromUrl(
                'http://sisnet.iptime.org:8092/cslist/' + name + '/' + name + '.json',
                {
                    shadows: Cesium.ShadowMode.DISABLED, //타일 표면에 그림자를 드리울지 여부. 로딩시 ENABLED가 아니면 속성 수정반영이 잘 안되었음
                    maximumScreenSpaceError: 1, //Default 16. 세분화 수준 향상 값 : 작을수록 디테일함
                    maximumMemoryUsage: 2048, //Default 512. 개발PC기준 1024 설정시 더 불안정 했음
                    cullWithChildrenBounds: true, //Default true. 최적화 옵션. 자식을 묶는 볼륨을 결합하여 타일을 제거할지 여부.
                    skipLevelOfDetail: true, //Default true. 최적화 옵션. 순회 중에 디테일 스킵의 레벨을 적용할지 어떨지를 판정
                    baseScreenSpaceError: 1024, //Default 1024. skipLevelOfDetail이 true 일 때, 디테일 수준을 건너 뛰기 전에 도달해야하는 화면 공간 오류
                    skipScreenSpaceErrorFactor: 16, //Default 16. skipLevelOfDetail이 true 인 경우 건너 뛸 최소 화면 공간 오류를 정의하는 배율. 로드 할 타일을 결정하기 위해 skipLevels와 함께 사용.
                    skipLevels: 1, //Default 1. skipLevelOfDetail이 true 인 경우 타일을로드 할 때 건너 뛸 최소 레벨 수를 정의하는 상수. 0이면 아무 레벨도 건너 뜀. 로드 할 타일을 결정하기 위해 skipScreenSpaceErrorFactor와 함께 사용.
                    immediatelyLoadDesiredLevelOfDetail: false, //Default false. skipLevelOfDetail이 true이면 최대 화면 공간 오류를 충족시키는 타일 만 다운로드. 건너 뛰는 요인은 무시되고 원하는 타일 만로드.
                    loadSiblings: false, //Default false. skipLevelOfDetail이 true 일 때 보이는 타일의 형제가 순회 중에 항상 다운로드되는지 여부를 결정,

                });

            this.map.scene.primitives.add(droneTileset);
            this.loadPrim[name + "_drone"] = droneTileset;

            const heightOffset = 22;
            const boundingSphere = droneTileset.boundingSphere;
            const cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
            const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
            const offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
            const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());

            droneTileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
            droneTileset._root.transform = Cesium.Matrix4.IDENTITY;
            this.map.scene.camera.flyToBoundingSphere(droneTileset.boundingSphere);

            // droneTileset.initialTilesLoaded.addEventListener(function () {
            //     console.log('초기 타일이 로드됨');
            // });
            //
            // droneTileset.allTilesLoaded.addEventListener(function () {
            //     console.log('모든 타일이 로드됨');
            //     // test();
            // });
            //
            // droneTileset.loadProgress.addEventListener(function (numberOfPendingRequests, numberOfTilesProcessing) {
            //     if ((numberOfPendingRequests === 0) && (numberOfTilesProcessing === 0)) {
            //         $("#tileLoading").html("3D Tile Loading...");
            //         $("#tileLoading").hide();
            //         return;
            //     }
            //     $("#tileLoading").show();
            //     $("#tileLoading").html("3D Tile Loading...(" + numberOfPendingRequests + "/" + numberOfTilesProcessing + ")");
            //     // console.log('Loading: requests: ' + numberOfPendingRequests + ', processing: ' + numberOfTilesProcessing);
            // });
        },

        removeFromName: function(name) {
            const drone = this.loadPrim[name + "_drone"];
            const asset = this.loadPrim[name + "_asset"];
            const prm = this.map.scene.primitives;

            if(drone !== undefined && asset !== undefined) {
                prm.remove(drone);
                prm.remove(asset);
                this.feature.pickedFeature = null;
            }
        },

        removeAll: function() {
            this.map.scene.primitives.removeAll();
        },

        getCodeName: function(codeSe, code) {
            var name;
            if(codeSe === 'BULD_SE_CD') {
                switch(code) {
                    case '0': name = '지상'; break;
                    case '1': name = '지하'; break;
                    case '2': name = '공중'; break;
                    default:
                }
            }else if(codeSe === 'BUL_DPN_SE') {
                switch(code) {
                    case "M": name = '주건물'; break;
                    case "S": name = '종속건물'; break;
                    default:
                }
            }else if(codeSe === 'BDTYP_CD') {
                switch(code) {
                    case "01003": name = "다가구주택"; break;
                    case "02001": name = "아파트"; break;
                    case "02004": name = "생활편익시설"; break;
                    case "03001": name = "소매점"; break;
                    case "03002": name = "휴게음식점"; break;
                    case "03024": name = "개방공중화장실"; break;
                    case "03999": name = "기타제1종근생"; break;
                    case "04402": name = "사무소"; break;
                    case "04999": name = "기타제2종근생"; break;
                    case "08101": name = "초등학교"; break;
                    case "08102": name = "중학교"; break;
                    case "08201": name = "유치원"; break;
                    case "08999": name = "기타교육연구및복지시설"; break;
                    default:
                }
            }else if(codeSe === 'JIJUK') {
                $.ajax({
                    url: "/map/getJijuk.do",
                    data: {
                        jusoCode: code
                    },
                    type: "GET",
                    async: false,
                    success: function(res) {
                        name = res.codeVo.jusoName;
                    }
                })
            }
            return name;
        }

    };

})(window, jQuery);