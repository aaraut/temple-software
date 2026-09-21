# Getting Started

### Reference Documentation
For further reference, please consider the following sections:

* [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
* [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/3.5.8/maven-plugin)
* [Create an OCI image](https://docs.spring.io/spring-boot/3.5.8/maven-plugin/build-image.html)
* [Spring Web](https://docs.spring.io/spring-boot/3.5.8/reference/web/servlet.html)
* [Spring Data JPA](https://docs.spring.io/spring-boot/3.5.8/reference/data/sql.html#data.sql.jpa-and-spring-data)
* [Spring Boot DevTools](https://docs.spring.io/spring-boot/3.5.8/reference/using/devtools.html)
* [Spring Boot Actuator](https://docs.spring.io/spring-boot/3.5.8/reference/actuator/index.html)

### Guides
The following guides illustrate how to use some features concretely:

* [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
* [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
* [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)
* [Accessing Data with JPA](https://spring.io/guides/gs/accessing-data-jpa/)
* [Building a RESTful Web Service with Spring Boot Actuator](https://spring.io/guides/gs/actuator-service/)

### Maven Parent overrides

Due to Maven's design, elements are inherited from the parent POM to the project POM.
While most of the inheritance is fine, it also inherits unwanted elements like `<license>` and `<developers>` from the parent.
To prevent this, the project POM contains empty overrides for these elements.
If you manually switch to a different parent and actually want the inheritance, you need to remove those overrides.

### Todos
Production Hardening Checklist
Good question 👍
This is exactly the right time to ask this.

Below is a clear, practical Production Hardening Checklist, specific to YOUR app (offline-first, temple setup, Spring Boot + React, JWT, local server).

I’ll keep it simple, actionable, and non-theoretical.

🔐 1. Security Hardening (MOST IMPORTANT)
✅ JWT

 Move JWT secret to application.yaml

 Use minimum 32+ chars secret

 Set token expiry (8–12 hrs is fine for temple)

 Reject expired tokens clearly

✅ Passwords

 BCrypt strength ≥ 10

 Never log passwords

 Mask password in exceptions

✅ Headers

 Disable stack traces in prod

 Add basic security headers:

X-Content-Type-Options

X-Frame-Options

X-XSS-Protection

🔒 2. HTTPS & Network (Temple Reality)
✅ HTTPS

 Use self-signed SSL or Let’s Encrypt

 Force HTTPS redirect

 No HTTP login in production

✅ Network

 Bind server to LAN IP, not 0.0.0.0

 Firewall: allow only temple LAN

 No public internet exposure (unless needed)

🧠 3. Offline-First Safety
✅ App Startup

 App must start without internet

 No blocking external calls on startup

✅ Time Sync

 Avoid depending on NTP/time servers

 Token expiry should tolerate small clock drift

🧾 4. Audit & Compliance (Temple-Critical)
✅ Audit Logs

 Never delete audit logs

 Store at least 1–2 years

 Add DB index on timestamp

✅ Admin Actions

 Log:

Login failures

Account lock/unlock

Password reset

🗄️ 5. Database Safety
✅ Backups (VERY IMPORTANT)

 Daily DB backup (automatic)

 Weekly offline backup (USB / HDD)

 Test restore once

✅ DB Integrity

 Unique constraints on:

username

 NOT NULL on critical fields

🚀 6. Application Stability
✅ Logging

 INFO in prod

 DEBUG only in dev

 Rotate logs

✅ Exception Handling

 User-friendly error messages

 No stack traces to UI

 Log technical details internally

🖥️ 7. UI / Frontend Safety
✅ Token Handling

 Store JWT in memory or sessionStorage

 NOT localStorage (XSS risk)

 Clear token on logout

✅ Role Guards

 Hide admin screens for users

 Disable buttons if no permission

🔁 8. Operational Controls
✅ Super Admin

 Exactly 1 Super Admin

 Store credentials securely

 Change default password immediately

✅ Emergency Access

 Document:

How to unlock admin

How to reset password

How to restore DB

🧪 9. Final Pre-Go-Live Checklist

 Login works after reboot

 App works with no internet

 Backup restore tested

 Super Admin login tested

 Audit log verified

🟢 In One Line as below

Production hardening = security + offline reliability + audit + recovery


Steps to create and push build
Create front end dist by using npm run build
copy content into static folder once done 
update the pom version of backend

cd backend
APP_VERSION=3.0.3
cd D:\Jamsawli\code-base\temple-software\backend
docker build -t alekhraut/temple-backend:3.0.3 .
docker push alekhraut/temple-backend:3.0.3
docker compose pull backend
docker compose up -d backend

On the server


i have used this cmd for deploying on server sed -i 's|alekhraut/temple-backend:3.0.2|alekhraut/temple-backend:3.0.3|' docker-compose.yml
docker compose pull backend
docker compose up -d backend

for UI check on browser from remote 
http://100.122.78.33:8081/login

** Pgadmin
http://100.122.78.33:5050/browser/

Email: admin@temple.com
Password: admin123
Once logged in, you'll need to register the Postgres server inside pgAdmin (first time only) — use:

Host: postgres (the service name — pgAdmin reaches it over the internal Docker network, not via Tailscale/localhost)
Port: 5432
Username: temple
Password: temple123
Database: templedb

jsut wanted to check how to access now server url using tailscale on my windows