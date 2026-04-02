CREATE TABLE users (
    id           SERIAL PRIMARY KEY,
    first_name   VARCHAR(100)  NOT NULL,
    last_name    VARCHAR(100)  NOT NULL,
    phone_number VARCHAR(20)   NOT NULL,
    email_id     VARCHAR(255)  NOT NULL UNIQUE,
    password     VARCHAR(255)  NOT NULL,
    role         VARCHAR(50)   NOT NULL DEFAULT 'user',
    otp          VARCHAR(10),
    otp_expiry   TIMESTAMP,
    is_verified  BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);