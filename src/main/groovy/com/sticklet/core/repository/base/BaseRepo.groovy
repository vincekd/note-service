package com.sticklet.core.repository.base

import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.NoRepositoryBean

@NoRepositoryBean
interface BaseRepo<T, ID extends Serializable> extends CrudRepository<T, ID> {

}
