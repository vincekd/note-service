package com.sticklet.core.config

import javax.servlet.DispatcherType
import javax.servlet.Servlet

import org.apache.catalina.connector.Connector
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.context.embedded.EmbeddedServletContainerFactory
import org.springframework.boot.context.embedded.FilterRegistrationBean
import org.springframework.boot.context.embedded.tomcat.TomcatEmbeddedServletContainerFactory
import org.springframework.cache.ehcache.EhCacheCacheManager
import org.springframework.cache.ehcache.EhCacheManagerFactoryBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.ClassPathResource
import org.springframework.web.servlet.DispatcherServlet
import org.springframework.web.servlet.config.annotation.EnableWebMvc
import org.springframework.web.servlet.config.annotation.WebMvcConfigurationSupport
import org.thymeleaf.templateresolver.ServletContextTemplateResolver

import com.sticklet.core.filter.LessFilter

@Configuration
@EnableWebMvc
class WebMvcConfiguration extends WebMvcConfigurationSupport {
    private static final Logger logger = LoggerFactory.getLogger(WebMvcConfiguration.class)

    @Value("\${server.redirectPort}")
    private Integer redirectPort

    @Value("\${server.port}")
    private Integer port

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
    public ServletContextTemplateResolver templateResolver() {
        ServletContextTemplateResolver resolver = new ServletContextTemplateResolver()
        resolver.setPrefix("/templates/")
        resolver.setSuffix(".html")
        resolver.setSuffix("HTML5")
        resolver
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

    @Bean
    public EmbeddedServletContainerFactory tomcatEmbeddedServletContainerFactory() {
        TomcatEmbeddedServletContainerFactory factory = new TomcatEmbeddedServletContainerFactory()
        //{
        //    @Override
        //    protected void postProcessContext(Context context) {
        //        SecurityConstraint securityConstraint = new SecurityConstraint()
        //        securityConstraint.setUserConstraint("CONFIDENTIAL")
        //        SecurityCollection collection = new SecurityCollection()
        //        collection.addPattern("/*")
        //        securityConstraint.addCollection(collection)
        //        context.addConstraint(securityConstraint)
        //    }
        //}
        factory.addAdditionalTomcatConnectors(createConnection())
        factory
    }

    private Connector createConnection() {
        String protocol = "org.apache.coyote.http11.Http11NioProtocol"
        Connector connector = new Connector(protocol)

        logger.info "setup redirect port $redirectPort to $port"

        connector.setScheme("http")
        connector.setPort(redirectPort)
        connector.setRedirectPort(port)
        connector
    }
}