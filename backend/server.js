console.log('Starting server...');

try {
  console.log('Requiring app...');
  const app = require('./app');
  console.log('App loaded successfully');

  app.listen(5000, () => {
    console.log('🚀 HireHelper Backend Server Running');
    console.log('Port: 5000');
    console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
  });
} catch (error) {
  console.error('❌ STARTUP ERROR:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}