import { AppDataSource } from './src/data-source';
import { User } from './src/entities/user.entity';

async function checkUsers() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({ take: 10 });
    console.log('Total users found:', users.length);
    users.forEach(u => {
      console.log(`Email: ${u.email}, Role: ${u.role}, Status: ${u.status}`);
    });
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
