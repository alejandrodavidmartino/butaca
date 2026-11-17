import mongoose from 'mongoose';

// Foto personalizada de un grupo. Va en su propia colección para no "engordar"
// las consultas de grupos: solo se descarga cuando el navegador pide la imagen.
const groupImageSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, unique: true },
    data: { type: Buffer, required: true },
    contentType: { type: String, enum: ['image/jpeg', 'image/png', 'image/webp'], required: true },
  },
  { timestamps: true }
);

export default mongoose.model('GroupImage', groupImageSchema);
