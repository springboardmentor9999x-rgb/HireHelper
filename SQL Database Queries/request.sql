CREATE TABLE requests (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    requester_id UUID NOT NULL,
    status INTEGER NOT NULL,
    
    CONSTRAINT fk_request_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_request_user
        FOREIGN KEY (requester_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
