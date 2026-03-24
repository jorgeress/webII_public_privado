import mongoose from 'mongoose';

const podcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      minlength: [3, 'El título debe tener al menos 3 caracteres'] 
    },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      minlength: [10, 'La descripción debe tener al menos 10 caracteres'] 
    },
    author: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: [true, 'El autor es obligatorio']
    },
    category: {
      type: String,
      enum: ['tech', 'science', 'history', 'comedy', 'news']
      
    },
    duration: {
      type: Number,
      min: [60, 'La duración debe ser de al menos 60 segundos'] 
    },
    episodes: {
      type: Number,
      default: 1
    },
    published: {
      type: Boolean,
      default: false 
    }
    
  },
  {
    timestamps: true, 
    versionKey: false
  }
);

export default mongoose.model('Podcast', podcastSchema);