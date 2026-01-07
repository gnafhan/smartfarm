import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';

async function seedAdmin() {
  console.log('🌱 Starting admin user seed...');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const UserModel = app.get(getModelToken('User'));
    const FarmModel = app.get(getModelToken('Farm'));

    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({ email: 'admin@livestock.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email: admin@livestock.com');
      console.log('🔑 Password: admin123');
      await app.close();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user first (without farm initially)
    console.log('👤 Creating admin user...');
    const adminUser = await UserModel.create({
      email: 'admin@livestock.com',
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'admin',
      status: 'active',
    });
    console.log('✅ Admin user created');

    // Create default farm with admin as owner
    console.log('🏭 Creating default farm...');
    const defaultFarm = await FarmModel.create({
      name: 'Default Farm',
      ownerId: adminUser._id,
      address: 'Main Farm Location',
      contactInfo: {
        email: 'admin@livestock.com',
        phone: '+1234567890',
      },
      stats: {
        totalLivestock: 0,
        totalBarns: 0,
        totalSensors: 0,
      },
    });
    console.log('✅ Default farm created');

    // Update admin user with farmId
    adminUser.farmId = defaultFarm._id;
    await adminUser.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@livestock.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role:     admin');
    console.log('🏭 Farm:     Default Farm');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n🚀 You can now login at: http://localhost:3000/login\n');

    // Create a farmer user as well
    console.log('👤 Creating farmer user...');
    const farmerPassword = await bcrypt.hash('farmer123', 10);
    await UserModel.create({
      email: 'farmer@livestock.com',
      password: farmerPassword,
      fullName: 'Farm Manager',
      role: 'farmer',
      status: 'active',
      farmId: defaultFarm._id,
    });

    console.log('✅ Farmer user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    farmer@livestock.com');
    console.log('🔑 Password: farmer123');
    console.log('👤 Role:     farmer');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seedAdmin()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
