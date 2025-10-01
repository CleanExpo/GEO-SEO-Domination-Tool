import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function initializeDatabase(dbPath: string = './database/geo-seo.db') {
  const db = new Database(dbPath, { verbose: console.log })

  // Read and execute schema
  const schemaPath = path.join(__dirname, 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf-8')

  // Split by semicolon and execute each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  statements.forEach(statement => {
    db.exec(statement)
  })

  console.log('Database initialized successfully')
  return db
}

export function getDatabase(dbPath: string = './database/geo-seo.db') {
  return new Database(dbPath)
}
