import mongoose, { Schema } from 'mongoose';
import { ProductCollection, ProductStatus, ProductTag } from '../libs/enums/product.enum';

const productSchema = new Schema(
	{
		productStatus: {
			type: String,
			enum: Object.values(ProductStatus),
			default: ProductStatus.PAUSE,
		},

		productCollection: {
			type: String,
			enum: Object.values(ProductCollection),
			required: false,
		},

		// ✅ YANGI: multi-select tags
		productTags: {
			type: [String],
			enum: Object.values(ProductTag),
			default: [],
			index: true,
		},

		productName: { type: String, required: true },
		productPrice: { type: Number, required: true },
		productDesc: { type: String },

		productImages: {
			type: [String],
			default: [],
		},

		productViews: { type: Number, default: 0 },
	},
	{ timestamps: true },
);

productSchema.index({ productName: 1, productSize: 1, productVolume: 1 }, { unique: true });
export default mongoose.model('Product', productSchema);
