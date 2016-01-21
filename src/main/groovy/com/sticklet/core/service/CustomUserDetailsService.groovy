package com.sticklet.core.service

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component

import com.sticklet.core.exception.UserNotRegisteredException
import com.sticklet.core.model.User

@Component
class CustomUserDetailsService implements UserDetailsService {
    private static final Logger logger = LoggerFactory.getLogger(CustomUserDetailsService.class)

    @Autowired
    private UserService userServ

    public static final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder()

    private org.springframework.security.core.userdetails.User userDetails

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userServ.getUserByUsername(username)

        if (user) {
            if (user.registered) {
                return new org.springframework.security.core.userdetails.User(user.username,
                    user.password, true, true, true, true, getAuthorities(user.role))
            } else {
                //this might be a bad way to do this...
                throw new UserNotRegisteredException(username)
            }
        } else {
            throw new UsernameNotFoundException(username)
        }
    }

    public List<GrantedAuthority> getAuthorities(String role) {
        List<GrantedAuthority> authList = new ArrayList<GrantedAuthority>()
        authList.add(new SimpleGrantedAuthority(role))
        authList
    }
}
