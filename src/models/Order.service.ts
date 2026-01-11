import { ObjectId } from 'mongoose';
import { Order, OrderInquiry, OrderItemInput, OrderUpdateInput } from '../libs/types/order';
import Errors, { HttpCode, Message } from '../libs/Errors';
import { Member } from '../libs/types/member';
import MemberService from './Member.service';
import OrderModel from '../schema/Order.model';
import OrderItemModel from '../schema/OrderItem.model';
import { shapeIntoMongooseObjectId } from '../libs/config';
import { OrderStatus } from '../libs/enums/order.enum';

class OrderService {
	private readonly orderModel;
	private readonly orderItemModel;
	private readonly memberService;

	constructor() {
		this.orderModel = OrderModel;
		this.orderItemModel = OrderItemModel;
		this.memberService = new MemberService();
	}

	public async createOrder(member: Member, input: OrderItemInput[]): Promise<Order> {
		const memberId = shapeIntoMongooseObjectId(member._id);
		const amount = input.reduce((accumulator, item) => {
			console.log('Processing Item:', item);
			console.log(`Price: ${item.itemPrice}, Quantity: ${item.itemQuantity}`);

			return accumulator + item.itemPrice * item.itemQuantity;
		}, 0);

		const delivery = amount < 100 ? 5 : 0;

		try {
			// Order yaratish
			const newOrder = await this.orderModel.create({
				orderTotal: amount + delivery, // amount = 787, delivery = 0, kutilgan natija: 787
				orderDelivery: delivery,
				memberId: memberId,
			});

			const orderId = newOrder._id;
			console.log('orderId', orderId);
			await this.recordOrderItem(orderId, input);

			return newOrder;
		} catch (err) {
			console.log('Error, model: createOrder:', err);
			throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED); // Xato yuzaga keldi
		}
	}

	private async recordOrderItem(orderId: ObjectId, input: OrderItemInput[]): Promise<void> {
		const promisedList = input.map(async (item: OrderItemInput) => {
			item.orderId = orderId;
			item.productId = shapeIntoMongooseObjectId(item.productId);
			await this.orderItemModel.create(item);
			return 'INSERTED';
		});

		console.log('promisedList:', promisedList);

		const orderItemsState = await Promise.all(promisedList);

		console.log('orderItemsState:', orderItemsState);
	}

	public async getMyOrders(member: Member, inquiry: OrderInquiry): Promise<Order[]> {
		const memberId = shapeIntoMongooseObjectId(member._id);
		const matches = { memberId: memberId, orderStatus: inquiry.orderStatus };

		const result = await this.orderModel
			.aggregate([
				{ $match: matches },
				{ $sort: { updatedAt: -1 } },
				{ $skip: (inquiry.page - 1) * inquiry.limit },
				{ $limit: inquiry.limit },
				{
					$lookup: {
						from: 'orderItems',
						localField: '_id',
						foreignField: 'orderId',
						as: 'orderItems',
					},
				},
				{
					$lookup: {
						from: 'products',
						localField: 'orderItems.productId',
						foreignField: '_id',
						as: 'productData',
					},
				},
			])
			.exec();

		if (!result || result.length === 0) {
			throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
		}

		return result;
	}

	public async updateOrder(member: Member, input: OrderUpdateInput): Promise<Order> {
		const memberId = shapeIntoMongooseObjectId(member._id);
		const orderId = shapeIntoMongooseObjectId(input.orderId);
		const orderStatus = input.orderStatus;

		const result = await this.orderModel
			.findOneAndUpdate({ memberId: memberId, _id: orderId }, { orderStatus: orderStatus }, { new: true })
			.exec();

		if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);
		if (orderStatus === OrderStatus.PROCESS) {
			await this.memberService.addUserPoint(member, 1);
		}
		return result;
	}
}

export default OrderService;
