require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const Item     = require('../models/Item');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  await User.deleteMany();
  await Item.deleteMany();
  console.log('Cleared existing data');

  const users = await User.insertMany([
    { name: 'Admin User',   email: 'admin@college.edu',  password: await bcrypt.hash('admin123', 10),  avatar: 'AU', role: 'admin' },
    { name: 'Arjun Sharma', email: 'arjun@college.edu',  password: await bcrypt.hash('pass123', 10),   avatar: 'AS', role: 'user'  },
    { name: 'Priya Verma',  email: 'priya@college.edu',  password: await bcrypt.hash('pass123', 10),   avatar: 'PV', role: 'user'  },
    { name: 'Rahul Gupta',  email: 'rahul@college.edu',  password: await bcrypt.hash('pass123', 10),   avatar: 'RG', role: 'user'  },
    { name: 'Sneha Joshi',  email: 'sneha@college.edu',  password: await bcrypt.hash('pass123', 10),   avatar: 'SJ', role: 'user'  },
    { name: 'Vikram Singh', email: 'vikram@college.edu', password: await bcrypt.hash('pass123', 10),   avatar: 'VS', role: 'user'  },
  ]);
  console.log(`Created ${users.length} users`);

  const items = await Item.insertMany([
    { type:'lost',  title:'iPhone 14 Pro',    category:'Electronics', description:'Black iPhone 14 Pro with cracked screen protector and a blue silicone case. Has a small sticker on the back.',       location:'Library, 2nd Floor',   date: new Date('2024-01-15'), postedBy: users[1]._id, contactName: users[1].name, contactEmail: users[1].email, status:'active'   },
    { type:'found', title:'Brown Leather Wallet', category:'Accessories', description:'Brown leather wallet found near the cafeteria food counter. Contains some cash, cards, and a student ID.',       location:'Cafeteria Main Hall',  date: new Date('2024-01-14'), postedBy: users[2]._id, contactName: users[2].name, contactEmail: users[2].email, status:'active'   },
    { type:'lost',  title:'MacBook Air M2',    category:'Electronics', description:'Silver MacBook Air M2 with a mountain landscape sticker on the lid. Charger cable also missing.',                   location:'Computer Lab A',       date: new Date('2024-01-13'), postedBy: users[3]._id, contactName: users[3].name, contactEmail: users[3].email, status:'resolved' },
    { type:'found', title:'Student ID Card',   category:'Documents',   description:'Student ID card found at the main entrance. The photo and name are clearly visible on the front.',                  location:'Main Gate Security',   date: new Date('2024-01-12'), postedBy: users[4]._id, contactName: users[4].name, contactEmail: users[4].email, status:'active'   },
    { type:'lost',  title:'Red Hydro Flask',   category:'Other',       description:'Red 32oz Hydro Flask water bottle with a small dent on the bottom. Has a sticker of a mountain near the top.',     location:'Sports Ground',        date: new Date('2024-01-11'), postedBy: users[5]._id, contactName: users[5].name, contactEmail: users[5].email, status:'active'   },
    { type:'found', title:'Black Umbrella',    category:'Other',       description:'Black compact umbrella with a curved wooden handle. Found folded in the corridor near the washrooms.',              location:'Hostel Block B',       date: new Date('2024-01-10'), postedBy: users[1]._id, contactName: users[1].name, contactEmail: users[1].email, status:'active'   },
    { type:'lost',  title:'AirPods Pro',       category:'Electronics', description:'White AirPods Pro 2nd gen in the original white case. Has a small pink sticker on the case lid.',                   location:'Canteen Near Counter', date: new Date('2024-01-09'), postedBy: users[2]._id, contactName: users[2].name, contactEmail: users[2].email, status:'active'   },
    { type:'found', title:'Blue Wildcraft Bag', category:'Bags',        description:'Blue Wildcraft backpack with several textbooks, a pencil box and a half-filled water bottle inside.',              location:'Lecture Hall 3',       date: new Date('2024-01-08'), postedBy: users[3]._id, contactName: users[3].name, contactEmail: users[3].email, status:'active'   },
    { type:'lost',  title:'Gold Earrings',     category:'Jewellery',   description:'A pair of small gold hoop earrings, approximately 1.5cm diameter. One may have a tiny scratch on the outer ring.', location:'Girls Hostel Mess',    date: new Date('2024-01-07'), postedBy: users[4]._id, contactName: users[4].name, contactEmail: users[4].email, status:'active'   },
    { type:'found', title:'Physics Textbook',  category:'Books',       description:'HC Verma Part 2 Physics textbook, looks well-used with several highlighted pages. Found on a bench.',              location:'Reading Room',         date: new Date('2024-01-06'), postedBy: users[5]._id, contactName: users[5].name, contactEmail: users[5].email, status:'active'   },
  ]);
  console.log(`Created ${items.length} items`);
  console.log('\n✅ Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Admin : admin@college.edu  / admin123');
  console.log('  Users : arjun@college.edu  / pass123');
  console.log('          priya@college.edu  / pass123\n');
  await mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
