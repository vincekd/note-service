package com.sticklet.core.config

import javax.servlet.DispatcherType
import javax.servlet.MultipartConfigElement

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.boot.context.embedded.FilterRegistrationBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.Ordered
import org.springframework.web.servlet.config.annotation.ContentNegotiationConfigurer
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurationSupport

import com.sticklet.core.filter.LessFilter

@Configuration
//@EnableWebMvc
//@ComponentScan
class WebMvcConfiguration extends WebMvcConfigurationSupport {
    private static final Logger logger = LoggerFactory.getLogger(WebMvcConfiguration.class)

    private static final String[] CLASSPATH_RESOURCE_LOCATIONS = [
        "classpath:/META-INF/resources/", "classpath:/resources/",
        "classpath:/static/", "classpath:/public/" ]

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        if (!registry.hasMappingForPattern("/webjars/**")) {
            registry.addResourceHandler("/webjars/**").addResourceLocations("classpath:/META-INF/resources/webjars/")
        }
        if (!registry.hasMappingForPattern("/**")) {
            registry.addResourceHandler("/**").addResourceLocations(CLASSPATH_RESOURCE_LOCATIONS)
        }
    }

    @Override
    public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
        //configurer.mediaTypes(["TEXT_CACHE_MANIFEST", ""])
        //        MediaType type = new MediaType("text", "cache-manifest")
        //        configurer.mediaType("appcache", type)
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/login").setViewName("login")
        registry.setOrder(Ordered.HIGHEST_PRECEDENCE)
        //registry.addViewController("/").setViewName("forward:/index.html")
        //registry.addViewController("/error").setViewName("forward:/404.html")
    }

    //    @Bean
    //    public WebMvcConfigurerAdapter forwardToIndex() {
    //        return new WebMvcConfigurerAdapter() {
    //            @Override
    //            public void addViewControllers(ViewControllerRegistry registry) {
    //                registry.addViewController("/").setViewName("forward:/index.html")
    //            }
    //        }
    //    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new StickletRequestInterceptor())
    }

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
}