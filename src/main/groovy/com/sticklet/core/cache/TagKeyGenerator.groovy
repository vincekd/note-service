package com.sticklet.core.cache

import java.lang.reflect.Method

import org.springframework.cache.interceptor.KeyGenerator
import org.springframework.stereotype.Component

import com.sticklet.core.model.User

@Component
class TagKeyGenerator implements KeyGenerator {
    //private static final Logger logger = LoggerFactory.getLogger(TagKeyGenerator.class)
    @Override
    public Object generate(Object target, Method method, Object... params) {
        User user = params[0]
        return "user-" + user.id
    }
}
