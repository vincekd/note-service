package com.sticklet.core.filter

import java.util.concurrent.ConcurrentHashMap

import javax.servlet.FilterChain
import javax.servlet.FilterConfig
import javax.servlet.ServletRequest
import javax.servlet.ServletResponse
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value

import com.asual.lesscss.LessEngine
import com.sticklet.core.filter.base.BaseContentFilter
import com.sticklet.core.filter.base.BaseContentFilter.CharResponseWrapper

class LessFilter implements BaseContentFilter {
    private static final Logger logger = LoggerFactory.getLogger(LessFilter.class)
    private FilterConfig config

    private static final ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<String, String>()

    @Value("\${debug.enabled}")
    private boolean debugEnabled = true

    private final LessEngine lessEngine = new LessEngine()
    private ClassLoader clazzLoader = Thread.currentThread().getContextClassLoader()

    public void init(FilterConfig config) {
        this.config = config
    }

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
        CharResponseWrapper wrappedResponse = new CharResponseWrapper((HttpServletResponse) response)
        chain.doFilter(request, wrappedResponse)
        try {
            byte[] bytes = wrappedResponse.getByteArray()
            String out = new String(bytes)
            String less = getCssFromURI(((HttpServletRequest) request).getRequestURI())
            if (less != null) {
                byte[] lessBytes = less.getBytes()
                response.setContentLength(less.size())
                response.setContentType("text/css")
                response.getOutputStream().write(lessBytes)
            }
        } catch (Exception e) {
            e.printStackTrace()
        }
    }

    public void destroy() {
        //nothing
    }

    private String getCssFromURI(String uri) {
        String less = cache[uri]
        if (less == null || debugEnabled) {
            less = compileLessResource(uri)
            cache[uri] = less
        }
        less
    }

    //    private String getCssFromURI(String uri, String str) {
    //        //String uri = req.getRequestURI()
    //        String less = cache[uri]
    //        if (less == null || debugEnabled) {
    //            if (str) {
    //                compileLessString(str)
    //            } else {
    //                less = compileLessResource(uri)
    //            }
    //            cache[uri] = less
    //        }
    //        less
    //    }

    private String compileLessResource(String uri) {
        lessEngine.compile(clazzLoader.getResource("META-INF/resources" + uri))
    }

    //    private String compileLessString(String less) {
    //        logger.debug "less string: $less"
    //        lessEngine.compile(less)
    //    }
}