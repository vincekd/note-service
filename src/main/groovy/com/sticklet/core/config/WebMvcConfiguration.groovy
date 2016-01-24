package com.sticklet.core.config

import javax.servlet.DispatcherType
import javax.servlet.MultipartConfigElement
import javax.servlet.Servlet

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.boot.context.embedded.FilterRegistrationBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.DispatcherServlet
import org.springframework.web.servlet.config.annotation.EnableWebMvc
import org.springframework.web.servlet.config.annotation.WebMvcConfigurationSupport

import com.sticklet.core.filter.LessFilter

@Configuration
//@EnableWebMvc
class WebMvcConfiguration extends WebMvcConfigurationSupport {
    private static final Logger logger = LoggerFactory.getLogger(WebMvcConfiguration.class)

    @Bean
    public MultipartConfigElement multipartConfigElement() {
        //10MB file upload size
        return new MultipartConfigElement("", 10 * 1024 * 1024, 10 * 1024 * 1024, 1024 * 1024);
    }

    @Bean
    public FilterRegistrationBean filterRegistrationBean() {
        FilterRegistrationBean registration = new FilterRegistrationBean()
        registration.with {
            setDispatcherTypes(DispatcherType.REQUEST)
            setFilter(lessFilter())
            addUrlPatterns("/less/*")
        }
        registration
    }

    @Bean
    public LessFilter lessFilter() {
        new LessFilter()
    }

    @Bean
    public Servlet dispatcherServlet() {
        DispatcherServlet ds = new DispatcherServlet()
        ds.with {
            setDetectAllHandlerAdapters(true)
            setDetectAllHandlerExceptionResolvers(true)
            setDetectAllHandlerMappings(true)
            setDetectAllViewResolvers(true)
            setThrowExceptionIfNoHandlerFound(true)
        }
        ds
    }
}