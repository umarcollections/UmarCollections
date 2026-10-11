import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      trim: true,
    },
    // Stays the same when the name changes, so shared links keep working
    slug: { type: String, required: true, unique: true },
    description: { type: String, trim: true, default: '' },
    // Shown on the home page category cards
    image: { type: { _id: false, url: String, publicId: String }, default: null },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

const Category = mongoose.model('Category', categorySchema);

export default Category;
