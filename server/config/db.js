import mongoose from 'mongoose';

const buildAtlasUri = () => {
  const user = process.env.MONGODB_ATLAS_USER;
  const pass = process.env.MONGODB_ATLAS_PASSWORD;
  const cluster = process.env.MONGODB_ATLAS_CLUSTER;
  const db = process.env.MONGODB_ATLAS_DB || 'saiteja';

  if (!user || !pass || !cluster) return null;

  return `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${cluster}/${db}?retryWrites=true&w=majority`;
};

const getMongoUri = () => {
  if (process.env.MONGODB_URI?.startsWith('mongodb')) {
    return process.env.MONGODB_URI;
  }

  const atlasUri = buildAtlasUri();
  if (atlasUri) return atlasUri;

  console.warn('\n⚠  MongoDB Atlas cluster not set in .env (MONGODB_ATLAS_CLUSTER is empty).');
  console.warn('   Using local MongoDB temporarily: mongodb://127.0.0.1:27017/saiteja');
  console.warn('   To use Atlas: paste cluster host from Atlas → Connect → Drivers\n');
  return 'mongodb://127.0.0.1:27017/saiteja';
};

const connectDB = async () => {
  try {
    const uri = getMongoUri();
    const conn = await mongoose.connect(uri);
    const label = uri.includes('mongodb+srv') ? 'MongoDB Atlas' : 'MongoDB Local';
    console.log(`${label} Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
