import mongoose, { Schema } from 'mongoose';
import { BrandCollection, ProductCollection, ProductStatus } from '../libs/enums/product.enum';

const productSchema = new Schema(
	{
		productStatus: {
			type: String,
			enum: ProductStatus,
			default: ProductStatus.PAUSE,
		},
		brandCollection: {
			type: String,
			enum: BrandCollection,
		},

		productCollection: {
			type: String,
			enum: ProductCollection,
			required: true,
		},

		productName: {
			type: String,
			required: true,
		},

		productPrice: {
			type: Number,
			required: true,
		},

		productLeftCount: {
			type: Number,
			required: true,
		},
		productDesc: {
			type: String,
		},
		productImages: {
			type: [String],
			default: [],
		},
		productViews: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true },
);

productSchema.index({ productName: 1, productSize: 1, productVolume: 1 }, { unique: true });
export default mongoose.model('Product', productSchema);
