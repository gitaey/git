package sis.com.map.web;

import egovframework.common.EgovProperties;
import org.apache.commons.io.IOUtils;
import org.codehaus.jackson.map.ObjectMapper;
import org.json.simple.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.security.cert.X509Certificate;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.nio.Buffer;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.StandardCharsets;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.util.Enumeration;
import java.util.Map.Entry;
import java.util.Random;

@Controller
@RequestMapping(value = "/map/proxy")
public class ProxyController {

    private static final Logger LOGGER = LoggerFactory.getLogger(ProxyController.class);

    private String VKEY = EgovProperties.getProperty("VWorld.KEY");

    private String apiUrl = EgovProperties.getProperty("VWorld.WMS");

    private String imgUrl = EgovProperties.getProperty("VWorld.IMG");

    private String searchUrl = EgovProperties.getProperty("VWorld.SEARCH");

    private String wmsUrl = EgovProperties.getProperty("GeoServer.WMS");

    private String wfsUrl = EgovProperties.getProperty("GeoServer.WFS");

    private String gwcUrl = EgovProperties.getProperty("GeoServer.GWC");

    private String sldUrl = EgovProperties.getProperty("GeoServer.SLD");

    /**
     * Get 방식 WMS 프록시
     *
     * @param request  요청 객체
     * @param response 응답 객체
     * @throws Exception
     */
    // @AuthExclude
    @RequestMapping(value = "/wms.do", method = RequestMethod.GET)
    public void proxyWMSGet(final HttpServletRequest request, final HttpServletResponse response) throws IOException {
        final String urlStr =  wmsUrl;
        proxyGet(urlStr, request, response, false, false);
    }

    /**
     * Get 방식 브이월드 프록시
     *
     * @param request  요청 객체
     * @param response 응답 객체
     * @throws Exception
     */
    // @AuthExclude
    @RequestMapping(value = "/vApi.do", method = RequestMethod.GET)
    public void proxyVWorldGet(final HttpServletRequest request, final HttpServletResponse response) throws IOException {
        final String urlStr =  apiUrl;
        proxyGet(urlStr, request, response, true, false);
    }

    /**
     * Get 방식 브이월드 주소검색
     *
     * @param request  요청 객체
     * @param response 응답 객체
     * @throws Exception
     */
    // @AuthExclude
    @RequestMapping(value = "/vSearch.do", method = RequestMethod.GET)
    public void proxyVWorldAddr(final HttpServletRequest request, final HttpServletResponse response) throws IOException {
        final String urlStr =  searchUrl;
        proxyGet(urlStr, request, response, true, true);
    }

    /**
     * Get 방식 브이월드 범례 프록시 (브이월드에서 직접 호출)
     *
     * @param request  요청 객체
     * @param response 응답 객체
     * @throws Exception
     */
    // @AuthExclude
    @RequestMapping(value = "/vImg.do", method = RequestMethod.GET)
    public void proxyVWorldImgGet(final HttpServletRequest request, final HttpServletResponse response) throws IOException {
        final String urlStr =  imgUrl;
        proxyGet(urlStr, request, response, true, false);
    }

    /**
     * Get 방식 브이월드 범례프록시 (지오서버로 우회하여 범례호출 xml 파일 필요)
     *
     * @param request  요청 객체
     * @param response 응답 객체
     * @throws Exception
     */
    // @AuthExclude
    @RequestMapping(value = "/img.do", method = RequestMethod.GET)
    public void proxyImgGet(final HttpServletRequest request, final HttpServletResponse response) throws IOException {
        final String urlStr =  apiUrl;
        proxyGet(urlStr, request, response, true, false);
    }

    /**
     * Get 방식 GWC 프록시
     *
     * @param request  요청 객체
     * @param response 응답 객체
     * @throws Exception
     */
    // @AuthExclude
    @RequestMapping(value = "/gwc.do")
    public void proxyGWCGet(final HttpServletRequest request, final HttpServletResponse response) throws IOException {
        final String urlStr = gwcUrl;
        proxyGet(urlStr, request, response, false, false);
    }

    /**
     * Post 방식 WMS 프록시
     *
     * @param request  요청 객체
     * @param response 응답 객체
     * @throws Exception
     */
    // @AuthExclude
    @RequestMapping(value = "/wms.do", method = RequestMethod.POST)
    public void proxyWMSPost(final HttpServletRequest request, final HttpServletResponse response) throws IOException {
        final String urlStr = wmsUrl;
        proxyPost(urlStr, request, response);
    }

    /**
     * Get 방식 WFS 프록시
     *
     * @param request  요청 객체
     * @param response 응답 객체
     * @throws Exception
     */
    // @AuthExclude
    @RequestMapping(value = "/wfs.do")
    public void proxyWFSGet(final HttpServletRequest request, final HttpServletResponse response) throws IOException {
        final String urlStr = wfsUrl;
        proxyGet(urlStr, request, response, false, false);
    }

    /**
     * 배경지도 프록시 URL
     *
     * @param request
     * @param response
     * @throws Exception
     */
    // @AuthExclude
    @RequestMapping(value = "/proxyBackgroundByUrl.do")
    public void proxyBackgroundByUrl(final HttpServletRequest request, final HttpServletResponse response)
            throws IOException {

        request.setCharacterEncoding("UTF-8");
        final String urlStr = request.getParameter("url");

        HttpURLConnection huc = null;
        OutputStream ios = null;

        final URL url = new URL(urlStr);

        try {
            TrustManager[] trustAllCerts = new TrustManager[]{new X509TrustManager() {
                public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                    return null;
                }

                public void checkClientTrusted(X509Certificate[] certs, String authType) {
                }

                public void checkServerTrusted(X509Certificate[] certs, String authType) {
                }

                @Override
                public void checkClientTrusted(java.security.cert.X509Certificate[] arg0, String arg1) {
                }

                @Override
                public void checkServerTrusted(java.security.cert.X509Certificate[] arg0, String arg1) {
                }
            }};

            SSLContext sc = SSLContext.getInstance("SSL");
            sc.init(null, trustAllCerts, new java.security.SecureRandom());
            HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());

            final URLConnection connection = url.openConnection();
            huc = (HttpURLConnection) connection;
            huc.setDoOutput(true);

            response.reset();
            response.setContentType(huc.getContentType());
            InputStream is = huc.getInputStream();

            ios = response.getOutputStream();
            IOUtils.copy(is, ios);
            IOUtils.closeQuietly(ios);
            IOUtils.closeQuietly(is);
        }catch(IOException e){

        } catch (NoSuchAlgorithmException e) {
            LOGGER.error("ERROR : NoSuchAlgorithmException");
        } catch (KeyManagementException e) {
            LOGGER.error("ERROR : KeyManagementException");
        } finally{
            if(huc != null){
                huc.disconnect();
            }
        }
    }

    /**
     * 브이월드 기본 배경지도 프록시
     *
     * @param request
     * @param response
     * @throws Exception
     */
    // @AuthExclude
    @RequestMapping(value = "/proxyBackground.do")
    public void proxyBackground(final HttpServletRequest request, final HttpServletResponse response) throws IOException {

        // final String urlStr = request.getParameter("url");
        final String x = request.getParameter("x");
        final String y = request.getParameter("y");
        final String z = request.getParameter("z");
        final String type = request.getParameter("type");
        final String length = request.getParameter("length");
        String urlStr = "";

        if("vworld".equals(type)) {
            urlStr = "http://api.vworld.kr/req/wmts/1.0.0/" + VKEY + "/Base/" + z + "/" + y + "/" + x + ".png ";
        } else if("daum".equals(type)) {
            urlStr = "https://map" + (new Random().nextInt(3) + 1) + ".daumcdn.net/map_2d/1810uis/L"
                    + (Integer.parseInt(length) - Integer.parseInt(z)) + "/" + ((Integer.parseInt(y) + 1) * -1) + "/" + x
                    + ".png";
        }

        HttpURLConnection huc = null;
        OutputStream ios = null;

        try {
            request.setCharacterEncoding("UTF-8");

            final URL url = new URL(urlStr);

            final URLConnection connection = url.openConnection();
            huc = (HttpURLConnection) connection;
            huc.setDoOutput(true);

            response.reset();
            response.setContentType(huc.getContentType());

            ios = response.getOutputStream();
            IOUtils.copy(huc.getInputStream(), ios);
        } catch (final IOException e) {
            throw e;
        } finally {
            if (ios != null) {
                ios.close();
            }
            if (huc != null) {
                huc.disconnect();
            }
        }
    }

    /**
     * 브이월드 항공영상 프록시
     *
     * @param request
     * @param response
     * @throws Exception
     */
    // @AuthExclude
    @RequestMapping(value = "/proxyBackgroundSatellite.do")
    public void proxyBackgroundSatellite(final HttpServletRequest request, final HttpServletResponse response)
            throws IOException {

        // final String urlStr = request.getParameter("url");
        final String x = request.getParameter("x");
        final String y = request.getParameter("y");
        final String z = request.getParameter("z");
        final String type = request.getParameter("type");
        final String length = request.getParameter("length");
        String urlStr = "";

        if("vworld".equals(type)) {
            urlStr = "http://api.vworld.kr/req/wmts/1.0.0/" + VKEY + "/Satellite/" + z + "/" + y + "/" + x + ".jpeg ";
        } else if("daum".equals(type)) {
            urlStr = "https://map" + (new Random().nextInt(3) + 1) + ".daumcdn.net/map_skyview/L"
                    + (Integer.parseInt(length) - Integer.parseInt(z)) + "/" + ((Integer.parseInt(y) * -1)) + "/" + x
                    + ".jpg";
        }

        // System.out.println(urlStr);

        HttpURLConnection huc = null;
        OutputStream ios = null;

        try {
            request.setCharacterEncoding("UTF-8");

            final URL url = new URL(urlStr);

            final URLConnection connection = url.openConnection();
            huc = (HttpURLConnection) connection;
            huc.setDoOutput(true);

            response.reset();
            response.setContentType(huc.getContentType());

            ios = response.getOutputStream();
            IOUtils.copy(huc.getInputStream(), ios);
        } catch (final IOException e) {
            throw e;
        } finally {
            if (ios != null) {
                ios.close();
            }
            if (huc != null) {
                huc.disconnect();
            }
        }
    }

    /**
     * 브이월드 하이브리드맵 프록시
     *
     * @param request
     * @param response
     * @throws Exception
     */
    // @AuthExclude
    @RequestMapping(value = "/proxyBackgroundHybrid.do")
    public void proxyBackgroundHybrid(final HttpServletRequest request, final HttpServletResponse response)
            throws IOException {

        // final String urlStr = request.getParameter("url");
        final String x = request.getParameter("x");
        final String y = request.getParameter("y");
        final String z = request.getParameter("z");
        final String type = request.getParameter("type");

        final String length = request.getParameter("length");
        String urlStr = "";

        if("vworld".equals(type)) {
            urlStr = "http://api.vworld.kr/req/wmts/1.0.0/" + VKEY + "/Hybrid/" + z + "/" + y + "/" + x + ".png ";
        } else if("daum".equals(type)) {
            urlStr = "https://map" + (new Random().nextInt(3) + 1) + ".daumcdn.net/map_hybrid/1810uis/L" + (Integer.parseInt(length) - Integer.parseInt(z)) + "/" + ((Integer.parseInt(y)) * -1) + "/" + x + ".png";
        }

        // System.out.println(urlStr);

        HttpURLConnection huc = null;
        OutputStream ios = null;

        try {
            request.setCharacterEncoding("UTF-8");

            final URL url = new URL(urlStr);

            final URLConnection connection = url.openConnection();
            huc = (HttpURLConnection) connection;
            huc.setDoOutput(true);

            response.reset();
            response.setContentType(huc.getContentType());

            ios = response.getOutputStream();
            IOUtils.copy(huc.getInputStream(), ios);
        } catch (final IOException e) {
            throw e;
        } finally {
            if (ios != null) {
                ios.close();
            }
            if (huc != null) {
                huc.disconnect();
            }
        }
    }

    /**
     * 배경지도 프록시
     *
     * @param request
     * @param response
     * @throws Exception
     */
    // @AuthExclude
    @RequestMapping(value = "/proxyAirphoto.do")
    public void proxyAirphoto(final HttpServletRequest request, final HttpServletResponse response) throws IOException {

        HttpURLConnection huc = null;
        OutputStream ios = null;

        String urlStr = gwcUrl;

        try {
            request.setCharacterEncoding("UTF-8");
            final StringBuffer params = new StringBuffer();
            for (final Object param : request.getParameterMap().entrySet()) {
                @SuppressWarnings("unchecked")
                final Entry<String, String[]> entry = (Entry<String, String[]>) param;

                if (entry.getKey().indexOf('=') >= 0) {
                    params.append(getLocaleString(entry.getKey()));
                } else {
                    params.append(entry.getKey());
                    params.append("=");

                    final String[] values = entry.getValue();

                    if (values.length > 0) {
                        String layerName = request.getCharacterEncoding() == null
                                ? URLEncoder.encode(getLocaleString(values[0]), "UTF-8")
                                : URLEncoder.encode(values[0], "UTF-8");

                        if ("TileRow".equals(entry.getKey().toString())) {
                            layerName = layerName.replaceAll("'", "");
                            layerName = layerName.replaceAll("%27", "");
                        }

                        params.append(layerName);
                    }
                    params.append("&");
                }
            }

            if (params.length() > 0 && params.substring(params.length() - 1).equals("&")) {
                params.deleteCharAt(params.length() - 1);
            }

            request.setCharacterEncoding("UTF-8");

            final URL url = new URL(urlStr.concat("?") + params);

            final URLConnection connection = url.openConnection();
            huc = (HttpURLConnection) connection;
            huc.setDoOutput(true);

            response.reset();
            response.setContentType(huc.getContentType());

            ios = response.getOutputStream();
            IOUtils.copy(huc.getInputStream(), ios);
        } catch (final IOException e) {
            throw e;
        } finally {
            if (ios != null) {
                ios.close();
            }
            if (huc != null) {
                huc.disconnect();
            }
        }
    }

    /**
     * Get 방식 프록시
     *
     * @param urlStr   요청 주소
     * @param request  요청 객체
     * @param response 응답 객체
     * @throws IOException
     */
    // @AuthExclude
    public void proxyGet(final String urlStr, final HttpServletRequest request, final HttpServletResponse response, boolean isVApi, boolean isSearchApi)
            throws IOException {
        HttpURLConnection huc = null;
        OutputStream ios = null;

        try {
            request.setCharacterEncoding("UTF-8");
            final StringBuffer params = new StringBuffer();
            for (final Object param : request.getParameterMap().entrySet()) {
                @SuppressWarnings("unchecked")
                final Entry<String, String[]> entry = (Entry<String, String[]>) param;

                if (entry.getKey().indexOf('=') >= 0) {
                    params.append(getLocaleString(entry.getKey()));
                }else if("SLD".equals(entry.getKey().toUpperCase())) {
                    String[] values = entry.getValue();

                    if (values.length > 0) {
                        params.append(entry.getKey());
                        params.append("=");

                        if(!isVApi) {
                            params.append(sldUrl.replace("https", "http") + "/" + values[0]);
                        } else {
                            params.append(sldUrl.replace("MapStyle", "raise") + "/" + values[0]);
                        }
                        params.append("&");
                    }
                }
                else if("CQL_FILTER".equals(entry.getKey().toUpperCase())) {
                    params.append(entry.getKey());
                    params.append("=");

                    final String[] values = entry.getValue();

                    if (values.length > 0) {
                        String value = values[0];
                        value = value.replaceAll(":s:", " ");
                        value = value.replaceAll(":q:", "'");
                        value = value.replaceAll(":p:", "%");
                        value = value.replaceAll(":a:", "and");
                        value = value.replaceAll(":e:", "=");
                        value = value.replaceAll(":Matching:", "like");

                        String val = request.getCharacterEncoding() == null
                                ? URLEncoder.encode(getLocaleString(value), "UTF-8")
                                : URLEncoder.encode(value, "UTF-8");


                        params.append(val);
                    }
                    params.append("&");
                } else {
                    params.append(entry.getKey());
                    params.append("=");

                    final String[] values = entry.getValue();

                    if (values.length > 0) {
                        String val = request.getCharacterEncoding() == null
                                ? URLEncoder.encode(getLocaleString(values[0]), "UTF-8")
                                : URLEncoder.encode(values[0], "UTF-8");

                        if ("TileRow".equals(entry.getKey().toString())) {
                            val = val.replaceAll("'", "");
                            val = val.replaceAll("%27", "");
                        }

                        params.append(val);
                    }
                    params.append("&");
                }
            }

            if (params.length() > 0 && params.substring(params.length() - 1).equals("&")) {
                params.deleteCharAt(params.length() - 1);
            }

            // 브이월드 요청시 키값 추가
            if(urlStr.indexOf("vworld") > -1) {
                params.append("&key=" + VKEY);
            }

            final URL url = new URL(urlStr.concat("?") + params);

//            System.out.println(urlStr.concat("?") + params);

            final URLConnection connection = url.openConnection();
            huc = (HttpURLConnection) connection;
            huc.setRequestMethod("GET");
            huc.setDoOutput(true);
            huc.setDoInput(true);
            huc.setUseCaches(false);
            huc.setDefaultUseCaches(false);

            response.reset();
            response.setContentType(huc.getContentType());

            ios = response.getOutputStream();

            if(isSearchApi) {
                BufferedReader bReader = new BufferedReader(new InputStreamReader(huc.getInputStream(), "UTF-8"));

                StringBuilder sb = new StringBuilder();
                String inputLine;

                while ((inputLine = bReader.readLine()) != null) {
                    sb.append(inputLine.replaceAll("\n", ""));
                }

                ios.write(sb.toString().getBytes(StandardCharsets.UTF_8));
            }
            else {
                IOUtils.copy(huc.getInputStream(), ios);
            }

        } catch (final IOException e) {
            throw e;
        } finally {
            if (ios != null) {
                ios.close();
            }
            if (huc != null) {
                huc.disconnect();
            }
        }

    }

    /**
     * Post 방식 프록시
     *
     * @param urlStr   요청 주소
     * @param request  요청 객체
     * @param response 응답 객체
     * @throws IOException
     */
    // @AuthExclude
    public void proxyPost(final String urlStr, final HttpServletRequest request, final HttpServletResponse response)
            throws IOException {
        HttpURLConnection huc = null;
        OutputStream ios = null;

        URL url;

        try {
            url = new URL(urlStr + "?");
            final URLConnection connection = url.openConnection();
            huc = (HttpURLConnection) connection;
            huc.setRequestMethod("POST");
            huc.setDoOutput(true);
            huc.setDoInput(true);
            huc.setUseCaches(false);
            huc.setDefaultUseCaches(false);
            huc.setRequestProperty("Content-Type", "text/xml;charset=utf-8");

            IOUtils.copy(request.getInputStream(), huc.getOutputStream());

            response.reset();
            response.setContentType(huc.getContentType());

            ios = response.getOutputStream();
            IOUtils.copy(huc.getInputStream(), ios);
        } catch (final IOException e) {
            throw e;
        } finally {
            if (ios != null) {
                ios.close();
            }
            if (huc != null) {
                huc.disconnect();
            }
        }
    }

    /**
     * 한글 값 처리
     *
     * @param value 인코딩할 문자열
     * @return
     * @throws UnsupportedEncodingException
     */
    // @AuthExclude
    private String getLocaleString(final String value) throws UnsupportedEncodingException {
        byte[] b;
        b = value.getBytes("8859_1");
        final CharsetDecoder decoder = Charset.forName("UTF-8").newDecoder();
        try {
            final CharBuffer r = decoder.decode(ByteBuffer.wrap(b));
            return r.toString();
        } catch (final CharacterCodingException e) {
            return new String(b, "EUC-KR");
        }
    }


}
