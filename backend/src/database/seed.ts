import { db } from './db';
import { users } from './schema';

export async function seed() {
  await db.insert(users).values([
    {
      email: 'teacher@test.com',
      passwordHash: 'hashedpassword',
      role: 'teacher',
    },
    {
      email: 'student@test.com',
      passwordHash: 'hashedpassword',
      role: 'student',
    },
  ]);
}
