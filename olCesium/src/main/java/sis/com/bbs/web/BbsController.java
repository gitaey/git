package sis.com.bbs.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import sis.com.bbs.service.BbsService;

import javax.annotation.Resource;

@Controller
public class BbsController {

    @Resource(name = "bbsService")
    BbsService bbsService;

    @RequestMapping("/bbs/index.do")
    public String bbsMain() throws Exception {
        return "bbs/index";
    }

}
