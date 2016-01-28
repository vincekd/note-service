//package com.sticklet.core.repository.base
//
//import java.lang.invoke.MethodHandleImpl.BindCaller.T
//
//import org.springframework.beans.factory.annotation.Autowired
//import org.springframework.data.mongodb.core.MongoOperations
//import org.springframework.data.mongodb.core.MongoTemplate
//import org.springframework.data.mongodb.core.mapping.BasicMongoPersistentEntity
//import org.springframework.data.mongodb.core.mapping.MongoPersistentEntity
//import org.springframework.data.mongodb.repository.MongoRepository
//import org.springframework.data.mongodb.repository.query.MongoEntityInformation
//import org.springframework.data.mongodb.repository.support.MappingMongoEntityInformation
//import org.springframework.data.mongodb.repository.support.MongoRepositoryFactory
//import org.springframework.data.mongodb.repository.support.MongoRepositoryFactoryBean
//import org.springframework.data.repository.NoRepositoryBean
//import org.springframework.data.repository.core.RepositoryMetadata
//import org.springframework.data.repository.core.support.RepositoryFactorySupport
//import org.springframework.data.util.ClassTypeInformation
//import org.springframework.data.util.TypeInformation
//
//@NoRepositoryBean
//public class BaseRepoFactoryBean<R extends MongoRepository<T, String>, T, ID extends Serializable> extends MongoRepositoryFactoryBean<R, T, ID> {
//
//    @Autowired
//    private static MongoTemplate mongoTemplate
//
//    protected MongoRepositoryFactory getRepositoryFactory(Class<T> clazz) {
//        return new BaseRepoImplFactory(clazz)
//    }
//    
//    private static class BaseRepoImplFactory extends MongoRepositoryFactory {
//        private Class clazz
//    
//        public BaseRepoImplFactory(Class clazz) {
//            super(mongoTemplate)
//            this.clazz = clazz
//        }
//    
//        public BaseRepoImpl getTargetRepository() {
//            return new BaseRepoImpl(clazz)
//        }
//    
//        public Class<?> getRepositoryClass() {
//            return BaseRepoImpl.class
//        }
//    }
//
//    @Override
//    protected RepositoryFactorySupport getFactoryInstance(MongoOperations operations) {
//        return new BaseRepoFactory<T, String>(operations)
//    }
//
//    private static class BaseRepoFactory<T, ID extends Serializable> extends MongoRepositoryFactory {
//
//        private MongoOperations mongo
//        public BaseRepoFactory(MongoOperations mongoOperations) {
//            super(mongoOperations)
//            mongo = mongoOperations
//        }
//
//        protected Object getTargetRepository(RepositoryMetadata metadata) {
//            TypeInformation<T> information = ClassTypeInformation.from((Class<T>) metadata.getDomainType())
//            MongoPersistentEntity<T> pe = new BasicMongoPersistentEntity<T>(information)
//            MongoEntityInformation<T,ID> mongometa = new MappingMongoEntityInformation<T, ID>(pe)
//
//            new BaseRepoImpl<T, ID>(mongometa, mongo)
//        }
//
//        protected Class<?> getRepositoryBaseClass(RepositoryMetadata metadata) {
//            BaseRepoImpl.class
//        }
//    }
//}
