package egovframework.common;

import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.*;

/**
 *  Class Name : EgovProperties.java
 *  Description : properties값들을 파일로부터 읽어와   Globals클래스의 정적변수로 로드시켜주는 클래스로
 *   문자열 정보 기준으로 사용할 전역변수를 시스템 재시작으로 반영할 수 있도록 한다.
 *  Modification Information
 *
 *     수정일         수정자                   수정내용
 *   -------    --------    ---------------------------
 *   2009.01.19    박지욱          최초 생성
 *	 2011.07.20    서준식 	      Globals파일의 상대경로를 읽은 메서드 추가
 *   2011.08.31  JJY            경량환경 템플릿 커스터마이징버전 생성
 *
 *  @author 공통 서비스 개발팀 박지욱
 *  @since 2009. 01. 19
 *  @version 1.0
 *  @see
 *
 */

public class EgovProperties{


    public static final String ERR_CODE =" EXCEPTION OCCURRED";
    public static final String ERR_CODE_FNFE =" EXCEPTION(FNFE) OCCURRED";
    public static final String ERR_CODE_IOE =" EXCEPTION(IOE) OCCURRED";


    static final char FILE_SEPARATOR     = File.separatorChar;


//    public static final String RELATIVE_PATH_PREFIX = EgovProperties.class.getResource("").getPath().replaceAll("%20", " ")
//            + System.getProperty("file.separator") + ".." + System.getProperty("file.separator")
//            + ".." + System.getProperty("file.separator") + ".." + System.getProperty("file.separator")
//            + ".." + System.getProperty("file.separator");

    public static final String RELATIVE_PATH_PREFIX = EgovProperties.class.getResource("").getPath().substring(0, EgovProperties.class.getResource("").getPath().lastIndexOf("egovframework"));

    public static final String GLOBALS_PROPERTIES_FILE
            = RELATIVE_PATH_PREFIX + "egovframework" + System.getProperty("file.separator") + "egovProps" + System.getProperty("file.separator") + "globals.properties";


    public static String getProperty(String keyName){
        String value = ERR_CODE;
        value="99";
        debug(GLOBALS_PROPERTIES_FILE + " : " + keyName);
        FileInputStream fis = null;
        try{
            Properties props = new Properties();
            fis  = new FileInputStream(GLOBALS_PROPERTIES_FILE);
            props.load(new java.io.BufferedInputStream(fis));
            value = props.getProperty(keyName).trim();
        }catch(FileNotFoundException fne){
            debug(fne);
        }catch(IOException ioe){
            debug(ioe);
        }catch(Exception e){
            debug(e);
        }finally{
            try {
                if (fis != null) fis.close();
            } catch (Exception ex) {
                debug(ex);
            }

        }
        return value;
    }

    public static ArrayList loadPropertyFile(String property){

        ArrayList keyList = new ArrayList();

        String src = property.replace('\\', FILE_SEPARATOR).replace('/', FILE_SEPARATOR);
        FileInputStream fis = null;
        try
        {

            File srcFile = new File(src);
            if (srcFile.exists()) {

                java.util.Properties props = new java.util.Properties();
                fis  = new FileInputStream(src);
                props.load(new java.io.BufferedInputStream(fis));

                int i = 0;
                Enumeration plist = props.propertyNames();
                if (plist != null) {
                    while (plist.hasMoreElements()) {
                        Map map = new HashMap();
                        String key = (String)plist.nextElement();
                        map.put(key, props.getProperty(key));
                        keyList.add(map);
                    }
                }
            }
        } catch (Exception ex){
            debug(ex);
        } finally {
            try {
                if (fis != null) fis.close();
            } catch (Exception ex) {
                debug(ex);
            }
        }

        return keyList;
    }

    private static void debug(Object obj) {
        if (obj instanceof java.lang.Exception) {
            //((Exception)obj).printStackTrace();
            LoggerFactory.getLogger(EgovProperties.class).debug("IGNORED: " + ((Exception)obj).getMessage());
        }
    }
}

