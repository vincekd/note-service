package com.sticklet.core.exception

import com.sticklet.core.exception.base.BaseException

class UserNotRegisteredException extends BaseException {
    public UserNotRegisteredException(String msg) {
        super(msg)
    }
}
