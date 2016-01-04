package com.sticklet.core.service

import javax.mail.internet.AddressException
import javax.mail.internet.InternetAddress

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContext
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Service

import com.sticklet.core.constant.Roles
import com.sticklet.core.model.User
import com.sticklet.core.repository.UserRepo

@Service
class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class)

    @Value("\${login.enabled}")
    boolean loginEnabled

    @Autowired
    private UserRepo repo

    public org.springframework.security.core.userdetails.User getPrincipal() {
        SecurityContext securityContext = SecurityContextHolder.getContext()
        Authentication authentication = securityContext.getAuthentication()
        if (authentication != null) {
            Object principal = authentication.getPrincipal()
            return (principal instanceof UserDetails ? principal : null)
        }
        return null;
    }

    public User getUserFromPrincipal() {
        if (repo) {
            if (loginEnabled) {
                repo.findByUsername(getPrincipal()?.getUsername())
            } else {
                repo.findByUsername("admin")
            }
        }
    }

    boolean usernameIsFree(String username) {
        return (repo.findByUsername(username) == null)
    }

    public User registerUser(Map u) {
        if (validatePassword(u.password, u.passwordRepeat) && validateUsername(u.username) && validateEmail(u.email)) {
            User user = new User([
                "username": u.username.trim(),
                "email": u.email.trim(),
                "password": u.password.trim(),
                "role": Roles.USER
            ])
            repo.save(user)
        }
    }

    public boolean validatePassword(String pass1, String pass2) {
        pass1 == pass2 && validatePassword(pass1)
    }

    public boolean validatePassword(String password) {
        password = password.trim()
        password && password.size() >= 4
    }

    public boolean validateUsername(String username) {
        username = username.trim()
        username && username.size() >= 4 && (username ==~ /[a-zA-Z0-9]+/)
    }

    public boolean validateEmail(String email) {
        try {
            InternetAddress address = new InternetAddress(email.trim(), true)
            address.validate()
            return true
        } catch (AddressException e) {
            e.printStackTrace()
        }
        return false
    }
}