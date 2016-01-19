package com.sticklet.core.config

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter
import org.springframework.security.config.annotation.web.servlet.configuration.EnableWebMvcSecurity
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder

import com.sticklet.core.service.AjaxLogoutSuccessHandler
import com.sticklet.core.service.CustomUserDetailsService

@Configuration
@EnableWebMvcSecurity
class WebSecurityConfig extends WebSecurityConfigurerAdapter {
    private static final Logger logger = LoggerFactory.getLogger(WebSecurityConfig.class)

    @Value("\${login.enabled}")
    boolean loginEnabled

    @Autowired
    private AjaxLogoutSuccessHandler ajaxLogoutSuccessHandler

    @Autowired
    private CustomUserDetailsService customUserService

    @Bean
    public DaoAuthenticationProvider authProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider()
        authProvider.setUserDetailsService(customUserService)
        authProvider.setPasswordEncoder(passwordEncoder())
        authProvider
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(customUserService)
        auth.authenticationProvider(authProvider())
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        new BCryptPasswordEncoder()
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        logger.info "LOGIN: ${(loginEnabled == true)}"
        if (loginEnabled == true) {
            http
                    .csrf().disable()
                    .authorizeRequests()
                    .antMatchers("/js/sticklet.login.js*", "/js/sticklet.js*", "/bower_components/**/*",
                        "/**/*.css", "/user/info", "/user/register", //"/templates/**/*.html"
                    ).permitAll()
                    .antMatchers("/**").hasAnyRole("ADMIN", "USER")
                    .anyRequest().authenticated()
                    .and()
                    .formLogin()
                    .loginPage("/login.html")
                    .defaultSuccessUrl("/index.html", true)
                    .permitAll()
                    .and()
                    .logout()
                    .deleteCookies("remove")
                    .deleteCookies("JSESSIONID")
                    .invalidateHttpSession(false)
                    .logoutUrl("/custom-logout")
                    .logoutSuccessUrl("/login.html")
                    .permitAll()
        } else {
            http
                    .csrf().disable()
                    .authorizeRequests()
                    .anyRequest().permitAll()
        }
    }
}
