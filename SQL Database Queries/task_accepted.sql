CREATE TABLE accepted_tasks (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    task_id INTEGER NOT NULL,
    status INTEGER NOT NULL,
    
    CONSTRAINT fk_accepted_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_accepted_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,
        
    CONSTRAINT unique_user_task
        UNIQUE (user_id, task_id)
);
