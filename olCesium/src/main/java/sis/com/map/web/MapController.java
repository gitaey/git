package sis.com.map.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.codehaus.jackson.type.TypeReference;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import sis.com.map.service.CodeVO;
import sis.com.map.service.JsonVO;
import sis.com.map.service.MapService;
import sis.com.map.service.NoticeVO;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class MapController {

    @Resource(name = "mapService")
    MapService mapService;

    @RequestMapping("/mapMain.do")
    public String mapPage(HttpServletRequest request, ModelMap model) throws Exception {

//        List<NoticeVO> noticeList = mapService.noticeList();

//        model.addAttribute("noticeList", noticeList);

        return "map3d/index";
    }

    @RequestMapping("/test1.do")
    public String test1() throws Exception {
        return "map3d/test1";
    }

    @RequestMapping("/test2.do")
    public String test2() throws Exception {
        return "map3d/test2";
    }

    @RequestMapping("/map/getTopojson.do")
    public void getTopojson(String target, HttpServletResponse response) throws Exception {

        JsonVO result = mapService.getTopojson(target);

        ObjectMapper mapper = new ObjectMapper();

        Map<String, Object> map = null;
        map = mapper.readValue(result.getValue(), Map.class);

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(new ObjectMapper().writeValueAsString(map));

    }

    @RequestMapping("/map/getJijuk.do")
    public String getJijuk(ModelMap model, String jusoCode, HttpServletResponse response) throws Exception {

        CodeVO result = mapService.getJijuk(jusoCode);

        model.addAttribute("codeVo", result);

        return "jsonView";
    }


}
