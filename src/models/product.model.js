import mongoose from "mongoose";
import paginate from "mongoose-paginate-v2";

const productSchema = new mongoose.Schema({
  title: { type: String, unique: true },
  description: { type: String, index: "text" },
  thumbnail: String,
  code: String,
  price: Number,
  stock: Number,
  category: { type: String, index: true },
  status: { type: Boolean, default: true },
  tags: Array,
  createdAt: { type: Date, default: Date.now }
});

productSchema.plugin(paginate);

const Product = mongoose.model("Product", productSchema);

export default Product;