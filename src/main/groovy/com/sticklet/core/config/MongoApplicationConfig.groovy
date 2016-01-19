package com.sticklet.core.config

import org.reflections.Reflections
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.convert.converter.Converter
import org.springframework.data.authentication.UserCredentials
import org.springframework.data.domain.AuditorAware
import org.springframework.data.mongodb.config.AbstractMongoConfiguration
import org.springframework.data.mongodb.config.EnableMongoAuditing
import org.springframework.data.mongodb.core.MongoTemplate
import org.springframework.data.mongodb.core.convert.CustomConversions
import org.springframework.data.mongodb.core.convert.DbRefResolver
import org.springframework.data.mongodb.core.convert.DefaultDbRefResolver
import org.springframework.data.mongodb.core.convert.MappingMongoConverter
import org.springframework.data.mongodb.core.mapping.MongoMappingContext

import com.mongodb.Mongo
import com.mongodb.MongoClient
import com.mongodb.WriteConcern

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
        return new MongoClient(dbHost, dbPort)
    }

    @Override
    protected String getDatabaseName() {
        return dbName
    }

    @Override
    protected String getMappingBasePackage() {
        "com.sticklet"
    }

    //    @Bean
    //    @Override
    //    public CustomConversions customConversions() {
    //        Reflections reflections = new Reflections("com.sticklet")
    //        //Set<Class> readClasses  = reflections.getSubTypesOf(BaseReadConverter.class)
    //        //Set<Class> writeClasses = reflections.getSubTypesOf(BaseWriteConverter.class)
    //
    //        //logger.info "Readers: {}", readClasses
    //        //logger.info "Writers: {}", writeClasses
    //
    //        DbRefResolver dbRefResolver = new DefaultDbRefResolver(mongoDbFactory())
    //        refResolver = dbRefResolver
    //
    //        List<Converter<?, ?>> converterList = new ArrayList<Converter<?, ?>>()
    //        //        converterList.addAll(readClasses.collect { Class c ->
    //        //            def newC = c.newInstance()
    //        //            newC.dbRefResolver = dbRefResolver
    //        //            newC
    //        //        })
    //        //        converterList.addAll(writeClasses.collect { Class c -> c.newInstance() })
    //
    //        return new CustomConversions(converterList)
    //    }

    @Bean
    public MongoTemplate mongoTemplate() throws Exception {

        UserCredentials userCredentials = new UserCredentials(dbUser, dbPass)
        MongoTemplate mongoTemplate = new MongoTemplate(mongo(), getDatabaseName(), userCredentials)
        mongoTemplate.setWriteConcern(WriteConcern.SAFE)

        //MongoTemplate mongoTemplate = new MongoTemplate(mongoDbFactory(), mongoConverter())

        mongoTemplate
    }

    //    @Bean
    //    public MappingMongoConverter mongoConverter() throws Exception {
    //        MongoMappingContext mappingContext = new MongoMappingContext()
    //
    //        DbRefResolver dbRefResolver = new DefaultDbRefResolver(mongoDbFactory())
    //
    //        MappingMongoConverter mongoConverter = new MappingMongoConverter(dbRefResolver, mappingContext)
    //
    //        mongoConverter.setCustomConversions(customConversions())
    //
    //        mongoConverter
    //    }

    @Bean
    public AuditorAware<String> myAuditorProvider() {
        new StickletAuditor()
    }
}