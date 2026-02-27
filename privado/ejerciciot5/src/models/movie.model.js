import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, minlength: 2 },
  director: { type: String, required: true },
  year: { type: Number, required: true, min: 1888, max: new Date().getFullYear() },
  genre: { 
    type: String, 
    required: true,
    enum: ['action', 'comedy', 'drama', 'horror', 'scifi'] 
  },
  copies: { type: Number, default: 5 },
  availableCopies: { type: Number },
  timesRented: { type: Number, default: 0 },
  cover: { type: String, default: null }
}, { timestamps: true });

// Pre-save para inicializar availableCopies
movieSchema.pre('save', function(next) {
  if (this.isNew && this.availableCopies === undefined) {
    this.availableCopies = this.copies;
  }
  next();
});

export default mongoose.model('Movie', movieSchema);