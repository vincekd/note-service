package com.sticklet.core.controller

import java.util.concurrent.ConcurrentHashMap

import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseBody

import com.sticklet.core.controller.base.BaseController
import com.sticklet.core.util.FileSystemUtil

@Controller
class ResourceController extends BaseController {
    private static final Logger logger = LoggerFactory.getLogger(ResourceController.class)

    private static final ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<String, String>()
    private static final String bowerBase = "/META-INF/resources/bower_components"

    @RequestMapping(value="/bower/css", method=RequestMethod.GET, produces="text/css")
    public @ResponseBody def getBowerCSS(@RequestParam("css") List<String> css, HttpServletRequest req, HttpServletResponse resp) {
        String url = css.join(",")
        String text = cache[url]
        if (!text) {
            text = getFiles(css)
            cache[url] = text
        }
        text
    }

    @RequestMapping(value="/bower/js", method=RequestMethod.GET, produces="text/javascript")
    public @ResponseBody def getBowerJS(@RequestParam("js") List<String> js, HttpServletResponse resp) {
        String url = js.join(",")
        String text = cache[url]
        if (!text) {
            text = getFiles(js)
            cache[url] = text
        }
        text
    }

    private static String getFiles(List<String> files) {
        files.collect {
            try {
                File f = FileSystemUtil.getResourceFile(bowerBase + it)
                f ? getTryCatch(f.text) : ""
            } catch (Exception e) {
                ""
            }
        }.join("\n")
    }

    private static String getTryCatch(String js) {
        //wrap libraries in try-catch in case on fails loading
        " try { \n $js \n } catch(err) { console.error(err); }\n"
    }
}