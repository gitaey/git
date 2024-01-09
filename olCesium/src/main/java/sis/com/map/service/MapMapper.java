package sis.com.map.service;

import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import java.util.List;

@Mapper("mapMapper")
public interface MapMapper {

    List<NoticeVO> noticeList() throws Exception;

    JsonVO getTopojson(String target) throws Exception;

    CodeVO getJijuk(String jusoCode) throws Exception;
}
