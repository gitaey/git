(function (window, $) {
    "use strict";

    window.SearchAddr = function (props = {}) {
        var self = this;

        this.keywordID = props.keywordID ? props.keywordID : "";
        this.resultID = props.resultID ? props.resultID : "";
        this.countID = props.countID ? props.countID : "";

        this.dataSources = new Cesium.CustomDataSource("searchEntity");
        sis3d.viewer.dataSources.add(this.dataSources);

        this.pagination = new SisPagination({
            id: "paginationWrap",
            totalCount: 0,
            onClick: function (evt) {
                self.searchName(evt);
            }
        });

        this.extendProps(props);
    };

    SearchAddr.prototype = {
        keywordID: "",
        resultID: "",
        countID: "",
        dataSources: "",
        entity: "",

        extendProps: function (props) {
            this.props = $.extend({}, this.props, props);
        },

        // 명칭검색 (카카오)
        searchName_kakao: function (page = 1) {
            console.log(this);

            var self = this;
            const size = 15;
            const query = $("#" + this.keywordID).val();

            var data = {
                page,
                size,
                query,
            };

            // AJAX 주소 검색 요청
            $.ajax({
                url: "https://dapi.kakao.com/v2/local/search/keyword.json", // 카카오 명칭검색
                type: "post",
                dataType: "json",
                data: data, // 요청 변수 설정
                async: true,
                beforeSend: (xhr) => {
                    xhr.setRequestHeader("Authorization", "KakaoAK baf884e4526f4f1d9f15d8b93b539c7d");
                },
                success: function (data) {
                    if (data.meta.total_count > 0) {
                        const items = data.documents ? data.documents : [];
                        if (data.meta.total_count > 45) data.meta.total_count = 45;

                        $("#" + self.countID).text(data.meta.total_count);
                        self.createTable(items, data.meta.total_count);

                        self.pagination.setDataCount(data.meta.total_count);
                    } else {
                        // 카카오 검색결과가 없을때
                        // 도로명주소 찾기
                        $.ajax({
                            url: "https://www.juso.go.kr/addrlink/addrLinkApiJsonp.do", //인터넷망
                            type: "post",
                            data: {
                                currentPage: 1,
                                countPerPage: 999,
                                resultType: "json",
                                confmKey: "U01TX0FVVEgyMDIxMDgwMjE0NTIyMjExMTQ3Nzc=",
                                keyword: query,
                            },
                            async: false,
                            dataType: "jsonp",
                            crossDomain: true,
                            success: function (data) {
                                var errCode = data.results.common.errorCode;
                                var errDesc = data.results.common.errorMessage;
                                if (errCode != "0") {
                                    alert(errCode + "=" + errDesc);
                                } else {
                                    if (data != null) {
                                        const items = data.results.juso ? data.results.juso : [];
                                        if (items.length > 45) items.length = 45;

                                        $("#" + self.countID).text(items.length);
                                        self.createTable(items, items.length, true);

                                        self.pagination.setDataCount(items.length);

                                        // var ele = (
                                        //     <>
                                        //         <div className="countWrap">
                                        //             <span>검색결과 </span>
                                        //             <span className="count">{items.length}</span>
                                        //             <span>건</span>
                                        //         </div>
                                        //
                                        //         <div className="itemsWrap">{self.createTable(items, items.length, true)}</div>
                                        //
                                        //         <div className="paginationWrap">
                                        //             <SisPagination totalCount={items.length} viewCount={size} onClick={self.searchName} />
                                        //         </div>
                                        //     </>
                                        // );
                                    }
                                }
                            },
                        });
                    }
                },
                error: function (xhr, status, error) {
                    alert("에러발생"); // AJAX 호출 에러
                },
            });
        },

        // 브이월드 검색
        searchName: function (page = 1) {
            var self = this;
            const size = 15;
            const query = $("#" + this.keywordID).val();

            $("#" + self.resultID).html("");
            $("#" + self.countID).text(0);
            self.pagination.setDataCount(0);

            var data = {
                page,
                size,
                query,
                request: "search",
                format: "json",
                type: "place",
                crs: "EPSG:4326",
            };

            // AJAX 주소 검색 요청
            $.ajax({
                url: "/map/proxy/vSearch.do",
                type: "get",
                dataType: "json",
                data: data, // 요청 변수 설정
                success: function (res) {
                    res = res.response;

                    if (res.record.total > 0) {
                        const items = res.result.items || [];

                        $("#" + self.countID).text(res.record.total);
                        self.createTable(items, res.record.total);

                        self.pagination.setDataCount(res.record.total);
                    } else {
                        data.type = "address";
                        data.category = "road";

                        // 도로명주소 찾기
                        $.ajax({
                            url: "/map/proxy/vSearch.do",
                            type: "get",
                            dataType: "json",
                            data,
                            success: function (res) {
                                res = res.response;

                                if (res.record.total > 0) {
                                    const items = res.result.items || [];

                                    $("#" + self.countID).text(res.record.total);
                                    self.createTable(items, res.record.total);
                                    self.pagination.setDataCount(res.record.total);
                                }
                                else {
                                    data.type = "address";
                                    data.category = "PARCEL";

                                    // 도로명주소 찾기
                                    $.ajax({
                                        url: "/map/proxy/vSearch.do",
                                        type: "get",
                                        dataType: "json",
                                        data,
                                        success: function (res) {
                                            res = res.response;

                                            if (res.record.total > 0) {
                                                const items = res.result.items || [];

                                                $("#" + self.countID).text(res.record.total);
                                                self.createTable(items, res.record.total);
                                                self.pagination.setDataCount(res.record.total);
                                            }
                                        },
                                    });
                                }
                            },
                        });
                    }
                },
                error: function (xhr, status, error) {
                    alert("에러발생"); // AJAX 호출 에러
                },
            });
        },

        // 명칭검색 테이블 생성
        createTable: function (items, totalCount, isRoadAddr) {
            var self = this;

            items.map((row, idx) => {
                if(!isRoadAddr) {
                    var title = row.title || "-";
                    row.address.bldnm = row.address.bldnm || "";
                    row.address.bldnmdc = row.address.bldnmdc || "";

                    if(title == "-") title = (row.address.bldnm + " " + row.address.bldnmdc) != " " ? row.address.bldnm + " " + row.address.bldnmdc : "-";

                    var addr = row.address.parcel || "-";
                    var road = row.address.road || "-";

                    var str = '<div id=addrSearch' + idx + ' class="item">';
                    if(title != "-") str += '<span class="itemTitle">' + title + '</span>';
                    if(addr != "-") str += '<span class="itemRoadAddr">' + addr + '</span>';
                    if(road != "-")str += '<span class="itemAddr">' + road + '</span>';
                    str += '</div>';

                    $("#" + self.resultID).append(str);

                    $("#addrSearch" + idx).on("click", function () {
                        self.movePoint(row, title);
                    });
                } else {
                    var roadAddr = row.roadAddrPart1;
                    var bdNm = row.bdNm;
                    var jibunAddr = row.jibunAddr.replace(bdNm, "");
                    var pnu = row.admCd + (row.mtYn == 0 ? "1" : "2") + self.lpad(row.lnbrMnnm, 4, "0") + self.lpad(row.lnbrSlno, 4, "0");

                    var str = '<div id=addrSearch' + idx + ' class="item">';
                    str += '<span class="itemTitle">' + (bdNm ? bdNm : "-") + '</span>';
                    str += '<span class="itemRoadAddr">' + jibunAddr + '</span>';
                    str += '<span class="itemAddr">' + roadAddr + '</span>';
                    str += '</div>';

                    $("#" + self.resultID).append(str);

                    $("#addrSearch" + idx).on("click", function () {
                        self.movePointByPnu(pnu, jibunAddr, roadAddr);
                    });
                }
            })
        },

        lpad: function(str, padLen, padStr) {
            if (padStr.length > padLen) {
                console.log("오류 : 채우고자 하는 문자열이 요청 길이보다 큽니다");
                return str;
            }
            str += ""; // 문자로
            padStr += ""; // 문자로
            while (str.length < padLen) str = padStr + str;
            str = str.length >= padLen ? str.substring(0, padLen) : str;
            return str;
        },

        // 명칭검색 위치이동
        movePoint: function (data, text) {
            var x = parseFloat(data.point.x);
            var y = parseFloat(data.point.y);

            this.dataSources.entities.removeAll();

            var pos = Cesium.Cartesian3.fromDegrees(x, y);
            var cartographic = Cesium.Cartographic.fromDegrees(x, y);
            var height = sis3d.scene.globe.getHeight(cartographic);
            var cartographic2 = new Cesium.Cartographic(cartographic.longitude, cartographic.latitude, height);
            var pos2 = new Cesium.Cartographic.toCartesian(cartographic2);

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

            this.entity = this.dataSources.entities.add({
                name: "searchEntity",
                position: pos,
                billboard: {
                    // color: Cesium.Color.RED,
                    image: "./images/map/location_pin2.png",
                    width: 48,
                    height: 48,
                    pixelOffset: new Cesium.Cartesian2(0, -12.5),
                    heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
                },
            });

            sis3d.viewer.camera.setView({
                destination: Cesium.Cartesian3.fromDegrees(
                    x,
                    y,
                    1000
                ),
                orientation: {
                    heading: 0,
                    pitch: -1.5682988103377,
                    roll: 0.0,
                },
            });

            // sis.setCenter(coordinate, "EPSG:4326");
            // overlay.setPosition(sisMap.view.getCenter());
            // $("#searchOverlayWrap").show();

            // var coord = sis.view.getCenter();
        },

        // pnu로 위치이동
        movePointByPnu: function(code, jibunAddr, roadAddr) {
            const self = this;
            const lyr = sisLyr.wfs.selectLayer;
            const source = lyr.getSource();

            let pnu = "";

            $.ajax({
                url: "/getJijukByPnu.do",
                type: "post",
                async: false,
                data: {
                    pnu: code,
                },
                success: (res) => {
                    if (res) {
                        let addr = "";
                        let addrToji = "";
                        let jibun = "";

                        if (res) {
                            source.clear();
                            const wkt = res.data.geom;


                            const feature = sisLyr.createFeatureByWKT(wkt);
                            // feature.getGeometry().transform("EPSG:5186", "EPSG:5186");
                            feature.setProperties(res);
                            // source.addFeature(feature);

                            if (self.overlay) sis.map.removeOverlay(self.overlay);
                            const wrap = document.createElement("div");
                            wrap.id = "searchOverlayWrap";
                            wrap.innerText = jibunAddr;
                            document.body.appendChild(wrap);

                            $(wrap).prepend('<i class="bi bi-geo-alt-fill"></i>');

                            self.overlay = new SisOverlay(`#searchOverlayWrap`, "bottom-center", [5, -10]);
                            sis.map.addOverlay(self.overlay);

                            sis.view.fit(feature.getGeometry().getExtent());
                            self.overlay.setPosition(sis.view.getCenter());
                            sis.view.setZoom(8);

                            $("#searchOverlayWrap").show();
                        } else {
                            addr = "촬영지역 정보가 없습니다.";
                        }
                    } else {
                        alert("지번정보가 존재하지 않습니다.");
                        window.location.href = "../../..";
                    }
                },
            });
        },

        // 좌표로 지적도 찾기
        getJijukByCoord: function (coord) {
            const feature = sisLyr.getPropByCoordinate(coord, "LYR0019");
            // console.log(feature);

            if (feature) {
                sisLyr.wfs.selectLayer.getSource().clear();
                sisLyr.wfs.selectLayer.getSource().addFeature(feature);
            }
        },
    }
})(window, jQuery)