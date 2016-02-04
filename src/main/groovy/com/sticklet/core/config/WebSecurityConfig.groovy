package com.sticklet.core.config

import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.authentication.dao.DaoAuthenticationProvider
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter
import org.springframework.security.config.annotation.web.configurers.ExpressionUrlAuthorizationConfigurer.ExpressionInterceptUrlRegistry
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.access.AccessDeniedHandler

import com.sticklet.core.service.AjaxLogoutSuccessHandler
import com.sticklet.core.service.CustomUserDetailsService

@Configuration
@EnableWebSecurity
class WebSecurityConfig extends WebSecurityConfigurerAdapter {
    private static final Logger logger = LoggerFactory.getLogger(WebSecurityConfig.class)
    private static final ALLOWED_RESOURCES = [
        "/bower_components/**/*", "/less/*.less", "/user/register", "/user/registration/*",
        "/templates/*.html", "/templates/mobile/*.html", "/js/*.js", "/cache.json", "/login.html",
        "/index.html", "/", "/login", "/custom-logout", "/sticklet.service-worker.js", "/404.html",
        "/robots.txt", "/note/*/public"
    ]

    @Value("\${login.enabled}")
    boolean loginEnabled

    @Autowired
    private AjaxLogoutSuccessHandler ajaxLogoutSuccessHandler

    @Autowired
    private CustomUserDetailsService customUserService

    @Autowired
    private StickletAuthenticationEntryPoint authenticationEntryPoint

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
            //configs
            http.exceptionHandling().authenticationEntryPoint(authenticationEntryPoint)
            http.csrf().disable()

            ExpressionInterceptUrlRegistry registry = http.authorizeRequests()
            ALLOWED_RESOURCES.each {
                registry.antMatchers(it).permitAll()
            }
            registry.antMatchers("/**").hasAnyRole("ADMIN", "USER")
            registry.anyRequest().authenticated()
            ((HttpSecurity)((HttpSecurity)registry.and()).formLogin()
                .loginPage("/login.html")
                .defaultSuccessUrl("/", true)
                .permitAll()
                .and())
                    .logout()
                    .deleteCookies("remove")
                    .deleteCookies("JSESSIONID")
                    .invalidateHttpSession(false)
                    .logoutUrl("/custom-logout")
                    .logoutSuccessUrl("/login.html")
                    .permitAll()
        } else {
            http.csrf().disable()
            http.authorizeRequests().anyRequest().permitAll()
        }
    }
}
