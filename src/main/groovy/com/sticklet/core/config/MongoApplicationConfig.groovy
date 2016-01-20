package com.sticklet.core.config

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.domain.AuditorAware
import org.springframework.data.mongodb.config.AbstractMongoConfiguration
import org.springframework.data.mongodb.config.EnableMongoAuditing
import org.springframework.data.mongodb.core.MongoTemplate
import org.springframework.data.mongodb.core.convert.DbRefResolver

import com.mongodb.Mongo
import com.mongodb.MongoClient
import com.mongodb.MongoClientURI

@Configuration
@EnableMongoAuditing
//@EnableMongoRepositories(repositoryFactoryBeanClass=BaseRepoFactoryBean.class)
class MongoApplicationConfig extends AbstractMongoConfiguration {
    private static final Logger logger = LoggerFactory.getLogger(MongoApplicationConfig.class)
    public static DbRefResolver refResolver

    @Value("\${spring.data.mongodb.databaseName}")
    String dbName
    @Value("\${spring.data.mongodb.host}")
    String dbHost
    @Value("\${spring.data.mongodb.port}")
    int dbPort
    @Value("\${spring.data.mongodb.username}")
    String dbUser
    @Value("\${spring.data.mongodb.password}")
    String dbPass

    @Override
    public Mongo mongo() throws Exception {
        logger.info "mongodb: $dbName, user: $dbUser"
        //logger.debug "mongo uri: " + "mongodb://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}"
        MongoClientURI uri  = new MongoClientURI("mongodb://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}")
        //new MongoClient(new ServerAddress(dbHost, dbPort),
        //     [MongoCredential.createCredential(dbUser, dbHost, dbPass.toCharArray())])
        new MongoClient(uri)
    }

    @Override
    protected String getDatabaseName() {
        return dbName
    }

    @Override
    protected String getMappingBasePackage() {
        "com.sticklet"
    }

    @Bean
    public MongoTemplate mongoTemplate() throws Exception {
        new MongoTemplate(mongo(), getDatabaseName())
    }

    @Bean
    public AuditorAware<String> myAuditorProvider() {
        new StickletAuditor()
    }
}