package com.sticklet.core.config

import org.springframework.cache.CacheManager
import org.springframework.cache.annotation.EnableCaching
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration


//@Configuration
//@EnableCaching
public class CachingConfig  {

    @Bean
    public CacheManager cacheManager() {
        //EhCacheCacheManager cacheManager = new EhCacheCacheManager();
        //cacheManager.setCacheManager(ehCacheManagerFactoryBean().getObject());
        //return cacheManager;
    }

//    @Bean
//    public EhCacheManagerFactoryBean ehCacheManagerFactoryBean() {
//        EhCacheManagerFactoryBean ehCacheManagerFactoryBean = new EhCacheManagerFactoryBean();
//        ehCacheManagerFactoryBean.setConfigLocation(new ClassPathResource("ehcache.xml"));
//        ehCacheManagerFactoryBean.setCacheManagerName("messageCache");
//        ehCacheManagerFactoryBean.setShared(true);
//        return ehCacheManagerFactoryBean;
//    }
}