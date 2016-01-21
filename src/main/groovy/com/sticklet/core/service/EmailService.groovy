package com.sticklet.core.service

import javax.mail.Authenticator
import javax.mail.Message
import javax.mail.PasswordAuthentication
import javax.mail.Session
import javax.mail.Transport
import javax.mail.internet.InternetAddress
import javax.mail.internet.MimeMessage

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.ApplicationContext
import org.springframework.stereotype.Service

import com.sticklet.core.exception.EmailFailedException

@Service
public class EmailService {
    private static Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private ApplicationContext appContext

    @Value("\${email.from}")
    private String fromEmail

    @Value("\${email.password}")
    private String password

    @Value("\${email.port}")
    private String port

    /**
     Outgoing Mail (SMTP) Server
     requires TLS or SSL: smtp.gmail.com (use authentication)
     Use Authentication: Yes
     Port for TLS/STARTTLS: 587
     */
    public void send(String to, String subject, String body) {
        //logger.debug "sending email: ${fromEmail} ${password} ${port}"
        Properties props = new Properties()
        props.put("mail.smtp.host", "smtp.gmail.com")
        props.put("mail.smtp.port", port)
        props.put("mail.smtp.auth", "true")
        props.put("mail.smtp.starttls.enable", "true")

        Authenticator auth = new Authenticator() {
                    protected PasswordAuthentication getPasswordAuthentication() {
                        new PasswordAuthentication(fromEmail, password)
                    }
                }

        Session session = Session.getInstance(props, auth)
        sendEmail(session, fromEmail, to, subject, body)
    }

    public static void sendEmail(Session session, String fromEmail, String toEmail, String subject, String body) {
        try {
            MimeMessage msg = new MimeMessage(session)

            //set message headers
            msg.with {
                addHeader("Content-type", "text/html; charset=UTF-8")
                addHeader("format", "flowed")
                addHeader("Content-Transfer-Encoding", "8bit")
                setFrom(new InternetAddress(fromEmail, "no-reply-sticklet-com"))
                setReplyTo(InternetAddress.parse(fromEmail, false))
                setSubject(subject, "UTF-8")
                setContent(body, "text/html; charset=utf-8")
                setSentDate(new Date())
                setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail, false))
            }

            msg.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail, false))

            Transport.send(msg)
        } catch (Exception e) {
            logger.warn "failed to send email..."
            e.printStackTrace()
            throw new EmailFailedException()
        }
    }
}
