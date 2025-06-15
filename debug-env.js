// Debug script to check Railway environment variables
console.log('🔍 Environment Debug Info:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
console.log('DATABASE_URL starts with postgresql:', process.env.DATABASE_URL?.startsWith('postgresql://'))

if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL)
    console.log('Database Host:', url.hostname)
    console.log('Database Port:', url.port)
    console.log('Database Name:', url.pathname.slice(1))
    console.log('Database User:', url.username)
  } catch (err) {
    console.error('❌ Invalid DATABASE_URL format:', err.message)
  }
}

console.log('\n🔧 Other PostgreSQL env vars:')
console.log('PGHOST:', process.env.PGHOST)
console.log('PGPORT:', process.env.PGPORT)
console.log('PGDATABASE:', process.env.PGDATABASE)
console.log('PGUSER:', process.env.PGUSER)
console.log('PGPASSWORD exists:', !!process.env.PGPASSWORD)

console.log('\n📋 All environment variables:')
Object.keys(process.env)
  .filter(key => key.includes('PG') || key.includes('DATABASE') || key.includes('POSTGRES'))
  .forEach(key => {
    console.log(`${key}:`, key.includes('PASSWORD') ? '[HIDDEN]' : process.env[key])
  })
