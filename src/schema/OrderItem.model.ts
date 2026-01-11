import mongoose, { Schema } from 'mongoose';

const orderItemSchema = new Schema(
	{
		itemQuantity: {
			type: Number,
			required: true,
		},

		itemPrice: {
			type: Number,
			required: true,
		},

		orderId: {
			type: Schema.Types.ObjectId,
			ref: 'Order',
		},

		productId: {
			type: Schema.Types.ObjectId,
			ref: 'Product',
		},
	},
	{ timestamps: true, collection: 'orderItems' }, // timestamps object ichida berilishi kerak
);

export default mongoose.model('OrderItems', orderItemSchema);
