package com.sticklet.core.repository.base

import org.springframework.data.repository.NoRepositoryBean
import org.springframework.data.repository.PagingAndSortingRepository
import org.springframework.data.rest.core.annotation.RepositoryRestResource

@NoRepositoryBean
@RepositoryRestResource(exported = false)
interface BaseRepo<T, ID extends Serializable> extends PagingAndSortingRepository<T, ID> {

}
