import mongoose from "mongoose";
import paginate from "mongoose-paginate-v2";

const productSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200
  },
  description: { 
    type: String, 
    required: true,
    index: "text",
    trim: true,
    maxlength: 1000
  },
  thumbnail: {
    type: String,
    default: null
  },
  code: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  stock: { 
    type: Number, 
    required: true,
    min: 0,
    default: 0
  },
  category: { 
    type: String, 
    required: true,
    index: true,
    trim: true,
    lowercase: true
  },
  status: { 
    type: Boolean, 
    default: true 
  },
  tags: {
    type: [String],
    default: []
  },
  thumbnails: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

productSchema.plugin(paginate);

const Product = mongoose.model("Product", productSchema);

export default Product;