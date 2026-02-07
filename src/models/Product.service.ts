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

	public async getPublicProducts(inquiry?: { q?: string; tag?: string; sort?: string }) {
		const q = inquiry?.q?.trim() || '';
		const tag = inquiry?.tag || 'ALL';
		const sort = inquiry?.sort || 'newest';

		const filter: any = { productStatus: ProductStatus.PROCESS };

		if (q) {
			filter.$or = [{ productName: { $regex: q, $options: 'i' } }, { productDesc: { $regex: q, $options: 'i' } }];
		}

		if (tag !== 'ALL') {
			filter.productTags = { $in: [tag] };
		}

		let sortQuery: any = { _id: -1 };
		if (sort === 'oldest') sortQuery = { _id: 1 };
		if (sort === 'price_asc') sortQuery = { productPrice: 1 };
		if (sort === 'price_desc') sortQuery = { productPrice: -1 };
		if (sort === 'name_asc') sortQuery = { productName: 1 };
		if (sort === 'name_desc') sortQuery = { productName: -1 };

		// ✅ typescript muammo bo‘lmasin:
		return await this.productModel.find(filter).sort(sortQuery).lean().exec();
	}

	public async getProduct(memberId: ObjectId | null, id: string): Promise<Product> {
		const productId = shapeIntoMongooseObjectId(id);

		let result = await this.productModel.findOne({ _id: productId, productStatus: ProductStatus.PROCESS }).exec();

		if (!result) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);

		if (memberId) {
			const input: ViewInput = {
				memberId,
				viewRefId: productId,
				viewGroup: ViewGroup.PRODUCT,
			};

			const existView = await this.viewService.checkViewExistence(input);

			if (!existView) {
				await this.viewService.insertMemberView(input);

				const updated = await this.productModel
					.findByIdAndUpdate(productId, { $inc: { productViews: 1 } }, { new: true })
					.exec();

				if (!updated) throw new Errors(HttpCode.NOT_FOUND, Message.NO_DATA_FOUND);
				result = updated;
			}
		}

		return result as any;
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
		hasImage?: string; // ✅ qo‘shildi
		sort?: string;
	}): Promise<Product[]> {
		const filter: any = {};

		// Search by name
		if (query?.q && query.q.trim()) {
			filter.productName = { $regex: query.q.trim(), $options: 'i' };
		}

		// Filter by tag
		if (query?.tag && query.tag !== 'ALL') {
			filter.productTags = query.tag;
		}

		// Filter by status
		if (query?.status && query.status !== 'ALL') {
			filter.productStatus = query.status;
		}

		// ✅ Filter by image presence
		if (query?.hasImage === 'YES') {
			// kamida 1 ta rasm bor
			filter['productImages.0'] = { $exists: true };
		} else if (query?.hasImage === 'NO') {
			// rasm yo‘q: array yo‘q yoki bo‘sh
			filter.$or = [{ productImages: { $exists: false } }, { productImages: { $size: 0 } }];
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
		id = shapeIntoMongooseObjectId(id);

		// ✅ normalize: productImages string bo‘lsa arrayga aylantiramiz
		if (input.productImages && !Array.isArray(input.productImages)) {
			input.productImages = [input.productImages as any];
		}

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
