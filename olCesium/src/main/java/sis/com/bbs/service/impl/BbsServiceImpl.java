package sis.com.bbs.service.impl;

import org.springframework.stereotype.Service;
import sis.com.bbs.service.BbsMapper;
import sis.com.bbs.service.BbsService;

import javax.annotation.Resource;

@Service("bbsService")
public class BbsServiceImpl implements BbsService {

    @Resource(name = "bbsMapper")
    BbsMapper bbsMapper;

}
