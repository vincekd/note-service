package com.sticklet.core.service

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.mongodb.core.MongoOperations
import org.springframework.data.mongodb.core.MongoTemplate
import org.springframework.data.mongodb.core.query.Criteria
import org.springframework.data.mongodb.core.query.Query
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Component

import com.sticklet.core.model.User

@Component
class CustomUserDetailsService implements UserDetailsService {
    private static final Logger logger = LoggerFactory.getLogger(CustomUserDetailsService.class)

    @Autowired
    private MongoTemplate mongoTemplate

    private org.springframework.security.core.userdetails.User userDetails

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        MongoOperations mongoOperation = (MongoOperations)mongoTemplate
        User user = mongoOperation.findOne(new Query(Criteria.where("username").is(username)), User.class)

        if (user) {
            userDetails = new org.springframework.security.core.userdetails.User(user.username,
                    user.password,
                    true,
                    true,
                    true,
                    true,
                    getAuthorities(user.role))
            return userDetails
        }

        throw new UsernameNotFoundException(username)
    }

    public List<GrantedAuthority> getAuthorities(String role) {
        List<GrantedAuthority> authList = new ArrayList<GrantedAuthority>()
        authList.add(new SimpleGrantedAuthority(role))
        return authList
    }
}
