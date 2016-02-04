package com.sticklet.core.config

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.EnableCaching
import org.springframework.cache.ehcache.EhCacheCacheManager
import org.springframework.cache.ehcache.EhCacheManagerFactoryBean
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration


@Configuration
@EnableCaching
public class CachingConfig  {
    private final Logger logger = LoggerFactory.getLogger(CachingConfig.class)
    
    @Bean
    public EhCacheCacheManager cacheManager() {
        EhCacheCacheManager cacheManager = new EhCacheCacheManager()
        cacheManager.setCacheManager(ehcache().getObject())
        cacheManager
    }

    @Bean
    public EhCacheManagerFactoryBean ehcache() {
        EhCacheManagerFactoryBean ehCacheFactory = new EhCacheManagerFactoryBean()
        //ehCacheFactory.setConfigLocation(new ClassPathResource("ehcache.xml"))
        //ehCacheFactory.setCacheManagerName("messageCache")
        //ehCacheFactory.setShared(true)
        ehCacheFactory
    }
}
