const { execSync } = require('child_process');
try {
  const result = execSync('npx prisma validate', { encoding: 'utf8' });
  console.log('SUCCESS:', result);
} catch (error) {
  console.log('ERROR STDOUT:', error.stdout);
  console.log('ERROR STDERR:', error.stderr);
}
