const pool = require('./src/config/db');

async function createTestTasks() {
  try {
    console.log('👥 Getting users from database...');
    const users = await pool.query('SELECT id, email FROM users LIMIT 3');
    
    if (users.rows.length < 2) {
      console.log('❌ Need at least 2 users to create test tasks');
      return;
    }

    console.log(`\n✅ Found ${users.rows.length} users:`);
    users.rows.forEach((u, i) => console.log(`  ${i + 1}. ${u.email}`));

    // Create test tasks for each user
    const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'];
    const categories = ['repair', 'design', 'writing', 'other'];
    let taskCount = 0;

    for (let i = 0; i < users.rows.length; i++) {
      const user = users.rows[i];
      
      // Create 3 tasks per user
      for (let j = 0; j < 3; j++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        
        await pool.query(
          `INSERT INTO tasks (user_id, title, description, category, location, status)
           VALUES ($1, $2, $3, $4, $5, 'open')`,
          [
            user.id,
            `Task ${j + 1} from ${user.email.split('@')[0]}`,
            `Description for task ${j + 1}`,
            category,
            location
          ]
        );
        taskCount++;
      }
    }

    console.log(`\n✅ Created ${taskCount} test tasks`);

    // Show all tasks
    console.log('\n📋 All Tasks:');
    console.log('─'.repeat(80));
    const allTasks = await pool.query(
      'SELECT id, user_id, title, status FROM tasks ORDER BY created_at DESC LIMIT 20'
    );
    
    allTasks.rows.forEach(t => {
      const userEmail = users.rows.find(u => u.id === t.user_id)?.email || 'Unknown';
      console.log(`User: ${userEmail.padEnd(25)} | Status: ${(t.status || 'NULL').padEnd(10)} | ${t.title}`);
    });
    console.log('─'.repeat(80));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTestTasks();
