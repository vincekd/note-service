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
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

import com.sticklet.core.constant.Roles
import com.sticklet.core.constant.StickletConsts
import com.sticklet.core.exception.EmailFailedException
import com.sticklet.core.exception.InvalidUserException
import com.sticklet.core.model.User
import com.sticklet.core.model.UserPreferences
import com.sticklet.core.repository.UserPreferencesRepo
import com.sticklet.core.repository.UserRepo

@Service
class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class)
    private static final List<String> userUpdatableProps = ["name", "bio", "prefs"]

    @Value("\${login.enabled}")
    boolean loginEnabled

    @Value("\${email.enabled}")
    boolean emailEnabled

    @Autowired
    private UserRepo repo

    @Autowired
    private UserPreferencesRepo userPrefsRepo

    @Autowired
    private PasswordEncoder passwordEncoder

    @Autowired
    private EmailService emailServ

    public org.springframework.security.core.userdetails.User getPrincipal() {

        SecurityContext securityContext = SecurityContextHolder.getContext()
        Authentication authentication = securityContext.getAuthentication()

        if (authentication) {
            Object principal = authentication.getPrincipal()
            return (principal instanceof UserDetails ? principal : null)
        }
        null
    }

    public User updateUser(User user, Map data) {
        data.each { String key, def val ->
            if (userUpdatableProps.contains(key)) {
                if (key == "prefs") {
                    val.each { k, v ->
                        user.prefs[k] = v
                    }
                    user.prefs = userPrefsRepo.save(user.prefs)
                } else {
                    user[key] = val
                }
            }
        }
        repo.save(user)
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

    public User getUserByUsername(String username) {
        repo.findByUsername(username)
    }

    public User createUser(Map<String, Object> opts) throws InvalidUserException {
        User user = new User(opts)
        if (!user.prefs) {
            user.prefs = userPrefsRepo.save(new UserPreferences())
        }
        if (user.username && user.password && user.email && user.role) {
            user.password = getPassword(user.password)
            try {
                return repo.save(user)
            } catch(Exception e) {
                e.printStackTrace()
            }
        }
        throw new InvalidUserException()
    }

    public boolean usernameIsFree(String username) {
        return (repo.findByUsername(username) == null)
    }

    public User registerUser(Map<String, String> u) {
        if (validatePassword(u.password, u.passwordRepeat) && validateUsername(u.username) && validateEmail(u.email)) {
            try {
                User user = createUser([
                    "username": u.username.trim(),
                    "password": u.password.trim(),
                    "email": u.email.trim(),
                    "role": Roles.USER
                ])
                if (emailEnabled) {
                    emailServ.send(user.email, StickletConsts.REGISTRATION_SUBJECT,
                            StickletConsts.REGISTRATION_CONTENT.replaceAll("%id%", user.id))
                }
                return user
            } catch (EmailFailedException e) {
                logger.warn "failed to send registration email, ${e.message}"
            }
        }
    }

    public boolean register(String uid) {
        User user = repo.findOne(uid)
        if (user) {
            user.registered = true
            repo.save(user)
            return true
        }
        false
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

    private getPassword(String pass) {
        passwordEncoder.encode(pass)
    }
}