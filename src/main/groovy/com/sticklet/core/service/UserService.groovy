package com.sticklet.core.service

import javax.mail.internet.AddressException
import javax.mail.internet.InternetAddress
import javax.servlet.http.HttpServletResponse

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
import com.sticklet.core.exception.PasswordMismatchException
import com.sticklet.core.model.User
import com.sticklet.core.model.UserPreferences
import com.sticklet.core.repository.UserPreferencesRepo
import com.sticklet.core.repository.UserRepo

@Service
class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class)
    private static final List<String> userUpdatableProps = ["name", "bio", "prefs"]

    @Value("\${login.enabled}")
    private boolean loginEnabled

    @Value("\${email.enabled}")
    private boolean emailEnabled

    @Value("\${login.register.confirmation}")
    private boolean registerConfirmation

    @Autowired
    private UserRepo repo
    @Autowired
    private UserPreferencesRepo userPrefsRepo
    @Autowired
    private PasswordEncoder passwordEncoder
    @Autowired
    private EmailService emailServ
    @Autowired
    private SettingsService settingsServ
    @Autowired
    private ActivityLogService activityLogServ

    public void resetPassword(String email, HttpServletResponse resp) {
        User user = repo.findByEmail(email)
        if (user) {
            if (emailEnabled) {
                String resetCode = ""
                emailServ.send(user.email, StickletConsts.RESET_PASSWORD_SUBJECT,
                        StickletConsts.RESET_PASSWORD_CONTENT.
                        replaceAll("%id%", user.id).
                        replaceAll("%resetCode%", resetCode))
            } else {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST)
            }
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND)
        }
    }

    //delete UserPreferences, User Settings, User ActivityLogs, User
    public void delete(User user) {
        userPrefsRepo.delete(user.prefs)
        settingsServ.deleteAll(user)
        activityLogServ.deleteAll(user)
        repo.delete(user)
    }

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
        if (data.password && data.password2) {
            if (data.password == data.password2) {
                user.password = getPassword(data.password)
            } else {
                throw new PasswordMismatchException()
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
        repo.findByUsername(username.toLowerCase())
    }

    public User createUser(Map<String, Object> opts) throws InvalidUserException {
        opts.username = opts.username?.toLowerCase()
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
        return (repo.findByUsername(username.toLowerCase()) == null)
    }

    public User registerUser(Map<String, String> u) {
        if (validatePassword(u.password, u.passwordRepeat) && validateUsername(u.username) && validateEmail(u.email)) {
            try {
                User user = createUser([
                    "username": u.username.trim().toLowerCase(),
                    "password": u.password.trim(),
                    "email": u.email.trim(),
                    "role": Roles.USER,
                    "registered": (registerConfirmation == false)
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
        password && password.size() >= 6
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