<%@ page language="java" contentType="text/html; charset=utf-8" pageEncoding="utf-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="ui" uri="http://egovframework.gov/ctl/ui" %>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<%
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Pragma", "no-cache");
    response.setDateHeader("Expires", 0);
    if (request.getProtocol().equals("HTTP/1.1"))
        response.setHeader("Cache-Control", "no-cache");
%>
<html>
<head>
    <title>3D 지도</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/map/map.css?ver=1" type="text/css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/js/plugins/Cesium-1.104/Build/CesiumUnminified/Widgets/widgets.css" type="text/css">

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-aFq/bzH65dt+w6FI2ooMVUpc+21e0SRygnTpmBvdBgSdnuTN7QbdgL+OapgHtvPp" crossorigin="anonymous">
    <link href="${pageContext.request.contextPath}/js/plugins/fontawesome-free-6.4.0-web/css/all.min.css" />

    <!-- bootstrap -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha2/dist/js/bootstrap.bundle.min.js" integrity="sha384-qKXV1j0HvMUeCBQ+QVp7JcfGl760yU08IQ+GpUo5hlbpg51QRiuqHAJz8+BrxE/N" crossorigin="anonymous"></script>

    <!-- font awesome -->
    <script src="${pageContext.request.contextPath}/js/plugins/fontawesome-free-6.4.0-web/js/all.min.js"></script>

    <!-- jQuery -->
    <script src="${pageContext.request.contextPath}/js/plugins/jquery-3.6.0/jquery-3.6.0.min.js"></script>
    <script src="${pageContext.request.contextPath}/js/plugins/jquery-ui-1.12.1/jquery-ui.min.js"></script>

    <!-- openlayers -->
    <script src="${pageContext.request.contextPath}/js/plugins/ol-v6.12.0/ol.js"></script>
    <script src="${pageContext.request.contextPath}/js/plugins/proj4/proj4.js"></script>

    <!-- Cesiumjs -->
    <script src="${pageContext.request.contextPath}/js/plugins/ol-cesium/olcesium.js" crossorigin="anonymous"></script>
    <script src="${pageContext.request.contextPath}/js/plugins/Cesium-1.90/Build/CesiumUnminified/Cesium.js" crossorigin="anonymous"></script>

    <!-- Html2Canvas -->
    <script src="${pageContext.request.contextPath}/js/plugins/html2canvas/html2canvas.js"></script>

    <script src="${pageContext.request.contextPath}/js/sis/com/sisCommon.js"></script>
    <!-- sisMap -->
    <script src="${pageContext.request.contextPath}/js/sis/3D/sis3dMap.js"></script>
    <script src="${pageContext.request.contextPath}/js/sis/3D/sis3dDraw.js"></script>
    <script src="${pageContext.request.contextPath}/js/sis/3D/sis3dLayer.js"></script>

    <script src="${pageContext.request.contextPath}/js/sis/2D/sisMap.js"></script>
    <script src="${pageContext.request.contextPath}/js/sis/2D/searchAddr.js"></script>
    <script src="${pageContext.request.contextPath}/js/sis/2D/sisPagination.js"></script>
    <link href="${pageContext.request.contextPath}/css/map/sisPagination.css" rel="stylesheet" type="text/css">
    <script src="${pageContext.request.contextPath}/js/map3d/init.js"></script>

    <script src='https://unpkg.com/@turf/turf@6/turf.min.js'></script>

    <script>
        var PATH = "${pageContext.request.contextPath}";
    </script>

</head>
<body>
    <div id="headerWrap">
        <div id="centerWrap">
            <div id="logoWrap">
                SISNET LOGO
                <select id="condition-periodYear"></select>
            </div>

<%--            <div id="previewWrap">--%>
<%--                ${noticeList[0].ntTitle}--%>
<%--            </div>--%>

<%--            <div id="menuWrap">--%>
<%--                <span><a href="${pageContext.request.contextPath}/bbs/index.do">공지사항</a></span>--%>
<%--            </div>--%>
        </div>
    </div>

    <div id="mapWrap">
        <div id="searchWrap">
            <i class="fa-solid fa-location-dot icon"></i>
            <input type="text" class="form-control" id="keyword"
                   placeholder="검색어(건물명,도로명,지번)를 입력해주세요.">
            <i id="btnSearch" class="fa-solid fa-magnifying-glass icon right"></i>
        </div>

        <div id="searchResultWrap">
            <div class="title">
                <span>검색결과</span>
                <i id="btnSearchClose" class="fa-solid fa-xmark"></i>
            </div>

            <div id="countWrap">
                <span>검색결과 </span>
                <span id="count" class="count">0</span>
                <span>건</span>
            </div>

            <div id="itemsWrap"></div>

            <div id="paginationWrap"></div>
        </div>

        <div id="mapMenuWrap">
            <div class="btn">
                <i class="fa-solid fa-gear icon"></i>
                <span class="txt">지도설정</span>

                <div class="menuPop" style="padding: 15px; right: 0; width: 490px;">
                    <div class="selectWrap">
                        <div>
                            <span class="title">배경지도</span>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="baseMap" id="baseMap" checked>
                                <label class="form-check-label" for="baseMap">
                                    2023
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="baseMap" id="airPhoto">
                                <label class="form-check-label" for="airPhoto">
                                    2022
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="baseMap" id="base2021">
                                <label class="form-check-label" for="base2021">
                                    2021
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="baseMap" id="vworldMap" checked>
                                <label class="form-check-label" for="vworldMap">
                                    일반지도
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="baseMap" id="hybridMap">
                                <label class="form-check-label" for="hybridMap">
                                    스카이뷰
                                </label>
                            </div>
                        </div>

                        <div>
                            <span class="title">3D건물</span>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="uild3d" id="build3dOn" >
                                <label class="form-check-label" for="build3dOn">
                                    활성화
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="uild3d" id="build3dOff" checked>
                                <label class="form-check-label" for="build3dOff">
                                    비활성화
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="btn">
                <i class="fa-solid fa-layer-group icon"></i>
                <span class="txt">레이어</span>

                <div class="menuPop">
                    <div id="lsmd_adm_sect_sgg_jn" class="menuWrap">
                        <i class="fa-solid fa-earth-asia menu"></i>
                        <span class="txt">행정구역</span>
                    </div>

                    <div id="lsmd_cont_ldreg" class="menuWrap active">
                        <i class="fa-solid fa-tornado menu"></i>
                        <span class="txt">지적도</span>
                    </div>
                </div>
            </div>

            <div class="btn">
                <i class="fa-solid fa-helicopter icon"></i>
                <span class="txt">드론영상</span>

                <div class="menuPop" style="text-align: left;">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="or3d2" id="drone002" name="drone">
                        <label class="form-check-label" for="drone002">
                            오룡지구
                        </label>
                    </div>

                </div>
            </div>

            <div class="btn">
                <div class="iconWrap">
                    <span class="txt hidden">건물정보</span>
                    <i class="fa-solid fa-building-circle-exclamation icon big buld-info"></i>
                    <span class="iconTooltip">건물정보</span>
                </div>
<%--                <div class="iconWrap">--%>
<%--                    <span class="txt hidden">화면분할</span>--%>
<%--                    <i class="fa-solid fa-table-columns icon small one"></i>--%>
<%--                    <span class="iconTooltip">화면분할</span>--%>
<%--                </div>--%>
            </div>

<%--            <div class="btn">--%>
<%--                <i class="fa-solid fa-bars icon"></i>--%>
<%--                <span class="txt hidden">메뉴</span>--%>
<%--            </div>--%>
        </div>

        <div id="mapControlWrap">
<%--            <div class="iconWrap">--%>
<%--                <span>거리뷰</span>--%>
<%--                <i class="fa-solid fa-street-view icon"></i>--%>
<%--            </div>--%>
            <span class="split"></span>

            <div class="iconWrap" id="calDis">
                <span>거리측정</span>
                <i class="fa-solid fa-ruler-horizontal icon top"></i>
            </div>
            <div class="iconWrap" id="calHeight">
                <span>표고측정</span>
                <i class="fa-solid fa-ruler-vertical icon center"></i>
            </div>
            <div class="iconWrap" id="calArea">
                <span>면적측정</span>
                <i class="fa-solid fa-vector-square icon center"></i>
            </div>
            <div class="iconWrap" id="clearMap">
                <span>초기화</span>
                <i class="fa-solid fa-rotate-right icon bottom"></i>
            </div>
            <span class="split"></span>

            <div class="iconWrap" id="saveScreen">
                <span>화면저장</span>
                <i class="fa-solid fa-floppy-disk icon"></i>
            </div>
<%--            <div class="iconWrap" id="shareScreen">--%>
<%--                <span>화면공유</span>--%>
<%--                <i class="fa-solid fa-share-nodes icon bottom"></i>--%>
<%--            </div>--%>
            <span class="split" style="height: 100px;"></span>

<%--            <i class="fa-solid fa-crosshairs icon"></i>--%>
            <span class="split"></span>

            <i class="fa-solid fa-plus icon top" id="zoomIn"></i>
            <i class="fa-solid fa-minus icon bottom" id="zoomOut"></i>
            <span class="split"></span>

<%--            <i id="compass" class="compass icon"></i>--%>
            <div id="compassWrap" onclick="compassClickEvt()">
                <object data="images/map/compass-regular.svg" type="image/svg+xml" id="compassObj" class="compass icon">
                </object>
            </div>
        </div>

        <div id="asideWrap">

        </div>

        <div id="map" class=""></div>
        <div id="centerPos"></div>
    </div>
    <div id="tileLoading"></div>
    <div id="info-modal">
        <div class="modal-header">
            <div class="modal-title">
                건축물대장
            </div>
            <div class="modal-close">
                <i class="fa-solid fa-xmark modal-close-btn"></i>
            </div>
        </div>
        <div class="modal-body">

        </div>
    </div>

</body>
</html>
