import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    // dev-only: stored as plaintext in your DB right now
    password: { type: String, required: true },
    name: String
  },
  { timestamps: true }
);

// Explicitly use the 'users' collection in users_db
export const User = mongoose.model('User', UserSchema, 'users');
