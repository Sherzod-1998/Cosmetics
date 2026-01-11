import { ProductStatus } from '../libs/enums/product.enum';
import { shapeIntoMongooseObjectId } from '../libs/config';
import Errors, { HttpCode, Message } from '../libs/Errors';
import { Product, ProductInput, ProductInquiry, ProductUpdateInput } from '../libs/types/product';
import ProductModel from '../schema/Product.model';
import { T } from '../libs/types/common';
import { ObjectId } from 'mongoose';
import { ViewGroup } from '../libs/enums/view.enum';
import { ViewInput } from '../libs/types/view';
import ViewService from './View.service';
import { LeanDocument } from 'mongoose';

class ProductService {
	private readonly productModel;
	public viewService;

	constructor() {
		this.productModel = ProductModel;
		this.viewService = new ViewService();
	}

	public async getProducts(inquiry: ProductInquiry): Promise<Product[]> {
		const match: T = { productStatus: ProductStatus.PROCESS };

		if (inquiry.productCollection && inquiry.productCollection.length > 0) {
			match.productCollection = { $in: inquiry.productCollection };
		}

		if (inquiry.search) {
			match.productName = { $regex: new RegExp(inquiry.search, 'i') };
		}

		const sort: T = inquiry.order === 'productPrice' ? { [inquiry.order]: 1 } : { [inquiry.order]: -1 };

		const result = await this.productModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{ $skip: (inquiry.page * 1 - 1) * inquiry.limit },
				{ $limit: inquiry.limit * 1 },
			])
			.exec();

		if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

		return result;
	}

	public async getProduct(memberId: ObjectId | null, id: string): Promise<Product> {
		const productId = shapeIntoMongooseObjectId(id);

		let result = await this.productModel.findOne({ _id: productId, ProductStatus: ProductStatus.PROCESS }).exec();

		if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

		if (memberId) {
			// check view log existance
			const input: ViewInput = {
				memberId: memberId,
				viewRefId: productId,
				viewGroup: ViewGroup.PRODUCT,
			};
			const existView = await this.viewService.checkViewExistence(input);

			console.log('exist:', !!existView);
			if (!existView) {
				// Insert New View Log
				await this.viewService.insertMemberView(input);

				//Increase Counts
				result = await this.productModel
					.findByIdAndUpdate(productId, { $inc: { productViews: +1 } }, { new: true })
					.exec();
			}
		}

		return result;
	}

	public async getRecommendedProducts(productId: string): Promise<LeanDocument<Product>[]> {
		const mainProduct = await this.productModel.findById(productId).lean();

		if (!mainProduct) throw new Error('Product not found');

		const recommendations = await this.productModel
			.find({
				_id: { $ne: mainProduct._id },
				productCollection: mainProduct.productCollection,
				productStatus: ProductStatus.PROCESS,
			})
			.limit(6)
			.lean();

		return recommendations;
	}

	public async createNewProduct(input: ProductInput): Promise<Product> {
		try {
			return await this.productModel.create(input);
		} catch (err) {
			console.log('Error, model:createNewProduct', err);
			throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);
		}
	}

	public async getAllProducts(query?: {
		q?: string;
		tag?: string;
		status?: string;
		sort?: string;
	}): Promise<Product[]> {
		const filter: any = {};

		// Search by name
		if (query?.q && query.q.trim()) {
			filter.productName = { $regex: query.q.trim(), $options: 'i' };
		}

		// Filter by tag (array ichida bor bo‘lsa match)
		if (query?.tag && query.tag !== 'ALL') {
			filter.productTags = query.tag;
		}

		// Filter by status
		if (query?.status && query.status !== 'ALL') {
			filter.productStatus = query.status;
		}

		// Sort
		let sortObj: any = { createdAt: -1 };
		switch (query?.sort) {
			case 'oldest':
				sortObj = { createdAt: 1 };
				break;
			case 'price_asc':
				sortObj = { productPrice: 1, createdAt: -1 };
				break;
			case 'price_desc':
				sortObj = { productPrice: -1, createdAt: -1 };
				break;
			case 'name_asc':
				sortObj = { productName: 1, createdAt: -1 };
				break;
			case 'name_desc':
				sortObj = { productName: -1, createdAt: -1 };
				break;
			default:
				sortObj = { createdAt: -1 };
		}

		const result = await this.productModel.find(filter).sort(sortObj).exec();
		if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
		return result;
	}

	public async updateChosenProduct(id: string, input: ProductUpdateInput): Promise<Product> {
		// string => objectId
		id = shapeIntoMongooseObjectId(id);
		const result = await this.productModel.findByIdAndUpdate({ _id: id }, input, { new: true }).exec();
		if (!result) throw new Errors(HttpCode.NOT_MODIFIED, Message.UPDATE_FAILED);
		return result;
	}
	public async deleteProduct(id: string): Promise<void> {
		id = shapeIntoMongooseObjectId(id);
		const result = await this.productModel.findByIdAndDelete(id).exec();
		if (!result) {
			throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
		}
	}
}

export default ProductService;
