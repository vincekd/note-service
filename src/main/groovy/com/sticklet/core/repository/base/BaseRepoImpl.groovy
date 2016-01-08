package com.sticklet.core.repository.base

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.mongodb.core.MongoOperations
import org.springframework.data.mongodb.repository.query.MongoEntityInformation
import org.springframework.data.mongodb.repository.support.MongoRepositoryFactory
import org.springframework.data.mongodb.repository.support.SimpleMongoRepository


public class BaseRepoImpl<T, ID extends Serializable> extends SimpleMongoRepository<T, ID> implements BaseRepo<T, ID> {
    private final Logger logger = LoggerFactory.getLogger(this.class)

    public BaseRepoImpl(MongoEntityInformation<T, String> metadata, MongoOperations mongoOperations) {
        super(metadata, mongoOperations)
        logger.debug "initializing BaseRepoImpl, $metadata, $mongoOperations"
    }

    @Autowired
    public BaseRepoImpl(MongoRepositoryFactory factory, MongoOperations mongoOperations) {
        this(factory.<T, String>getEntityInformation(T.class), mongoOperations);
    }
    
    
//    @Autowired
//    private static MongoTemplate mongoOperations
//
//    @Autowired
//    private static EntityInformationCreator entityInformationCreator

    //public BaseRepoImpl(Class<T> type) { 
    //    super((MongoEntityInformation<T, ID>) entityInformationCreator.getEntityInformation(type), mongoOperations);
    //}
    
    @Override
    public T save(T entity) {
        logger.debug "saving enitty: $entity"
        super.save(entity)
    }
}

