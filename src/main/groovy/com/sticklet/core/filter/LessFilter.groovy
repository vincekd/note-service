package com.sticklet.core.filter

import java.util.concurrent.ConcurrentHashMap

import javax.servlet.Filter
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

class LessFilter implements Filter {
    private static final Logger logger = LoggerFactory.getLogger(LessFilter.class)
    private FilterConfig config

    private static final ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<String, String>()

    @Value("\${debug.enabled}")
    private boolean debugEnabled = false

    private final LessEngine lessEngine = new LessEngine()
    private ClassLoader clazzLoader = Thread.currentThread().getContextClassLoader()

    public void init(FilterConfig config) {
        this.config = config
    }

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
        try {
            HttpServletRequest req = (HttpServletRequest) request
            HttpServletResponse resp = (HttpServletResponse) response

            OutputStream os = resp.getOutputStream()
            resp.resetBuffer()

            String uri = req.getRequestURI()
            String less = cache[uri]
            if (less == null || debugEnabled) {
                less = compileLessResource(uri)
                cache[uri] = less
            }

            PrintWriter pw = new PrintWriter(os)
            pw.write(less)
            pw.flush()

            resp.setContentType("text/css")
        } catch (Exception e) {
            e.printStackTrace()
        }
        chain.doFilter(request, response)
    }

    public void destroy() {
        //nothing
    }
    
    private String compileLessResource(String uri) {
        lessEngine.compile(clazzLoader.getResource("META-INF/resources" + uri))
    }
}