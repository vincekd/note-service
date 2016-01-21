package org.egr.monster.core.service;

import java.util.Date;
import java.util.Properties;

import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import org.apache.commons.lang.CharEncoding;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
	private static Logger logger = LoggerFactory.getLogger(EmailService.class);

	@Autowired public ApplicationContext appContext;
	
	@Value("${email.from}")
	public String fromEmail;

	@Value("${email.password}")
	public String password;
	
	@Value("${email.port}")
	public String port;
	
   /**
	  Outgoing Mail (SMTP) Server
	  requires TLS or SSL: smtp.gmail.com (use authentication)
	  Use Authentication: Yes
	  Port for TLS/STARTTLS: 587
	*/
	public void send(String to, String subject, String body) {
		Properties props = new Properties();
		props.put("mail.smtp.host", "smtp.gmail.com"); //SMTP Host
		props.put("mail.smtp.port", port); //TLS Port
		props.put("mail.smtp.auth", "true"); //enable authentication
		props.put("mail.smtp.starttls.enable", "true"); //enable STARTTLS
		
		//create Authenticator object to pass in Session.getInstance argument
		Authenticator auth = new Authenticator() {
			//override the getPasswordAuthentication method
			protected PasswordAuthentication getPasswordAuthentication() {
				return new PasswordAuthentication(fromEmail, password);
			}
		};
		
		Session session = Session.getInstance(props, auth);
		sendEmail(session, fromEmail, to, subject, body);
	}

    public static void sendEmail(Session session, String fromEmail, String toEmail, String subject, String body) {
	    try {
		    MimeMessage msg = new MimeMessage(session);
		    
		    //set message headers
		    msg.addHeader("Content-type", "text/html; charset=UTF-8");
		    msg.addHeader("format", "flowed");
		    msg.addHeader("Content-Transfer-Encoding", "8bit");
            
		    msg.setFrom(new InternetAddress(fromEmail, "nCoder NoReply"));
		    msg.setReplyTo(InternetAddress.parse(fromEmail, false));
            
		    msg.setSubject(subject, "UTF-8");
//		    msg.setText(body, "UTF-8");
		    msg.setContent(body, "text/html; charset=utf-8"); //CharEncoding.UTF_8);
		    msg.setSentDate(new Date());
            
		    msg.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail, false));
		    logger.debug("Message is ready");
		    
		    Transport.send(msg);
            
		    logger.debug("EMail Sent Successfully!!");
	    } catch (Exception e) {
		    e.printStackTrace();
	    }
   }
}