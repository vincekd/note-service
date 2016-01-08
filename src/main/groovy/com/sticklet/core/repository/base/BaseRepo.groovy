package com.sticklet.core.repository.base

import org.springframework.data.repository.NoRepositoryBean
import org.springframework.data.repository.PagingAndSortingRepository

@NoRepositoryBean
interface BaseRepo<T, ID extends Serializable> extends PagingAndSortingRepository<T, ID> {

}
