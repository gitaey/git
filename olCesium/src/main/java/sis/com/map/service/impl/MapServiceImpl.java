package sis.com.map.service.impl;

import org.springframework.stereotype.Service;
import sis.com.map.service.*;

import javax.annotation.Resource;
import java.util.List;

@Service("mapService")
public class MapServiceImpl implements MapService {

    @Resource(name = "mapMapper")
    MapMapper mapMapper;

    @Override
    public List<NoticeVO> noticeList() throws Exception {
        return mapMapper.noticeList();
    }

    @Override
    public JsonVO getTopojson(String target) throws Exception {
        return mapMapper.getTopojson(target);
    }

    @Override
    public CodeVO getJijuk(String jusoCode) throws Exception {
        return mapMapper.getJijuk(jusoCode);
    }
}
