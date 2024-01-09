<%@ page language="java" contentType="text/html; charset=utf-8" pageEncoding="utf-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<%@ taglib prefix="ui" uri="http://egovframework.gov/ctl/ui" %>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<!-- 캐시 삭제 소스 시작 -->
<%
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Pragma", "no-cache");
    response.setDateHeader("Expires", 0);
    if (request.getProtocol().equals("HTTP/1.1"))
        response.setHeader("Cache-Control", "no-cache");
%>
<!-- 캐시 삭제 소스 끝 -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
<%--    <link rel="icon" type="image/png" href="${pageContext.request.contextPath}/images/favicon/favicon2.png"/>--%>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="">
    <!-- 캐시 삭제 소스 시작 -->
    <meta http-equiv="Expires" content="-1">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Cache-Control" content="No-Cache">
    <!-- 캐시 삭제 소스 끝 -->

    <script src="${pageContext.request.contextPath}/js/plugins/jquery-3.6.0/jquery-3.6.0.min.js"></script>

    <title>ol-Cesium</title>
</head>

<body>
ol-Cesium
<br/>
<a href="${pageContext.request.contextPath}/mapMain.do">지도이동</a>

</body>
</html>