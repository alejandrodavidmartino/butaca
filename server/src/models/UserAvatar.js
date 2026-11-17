import mongoose from 'mongoose';

// Foto de perfil de un usuario (en su propia colección, igual que las fotos de grupo)
const userAvatarSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    data: { type: Buffer, required: true },
    contentType: { type: String, enum: ['image/jpeg', 'image/png', 'image/webp'], required: true },
  },
  { timestamps: true }
);

export default mongoose.model('UserAvatar', userAvatarSchema);
