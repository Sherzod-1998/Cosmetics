import { ProductStatus, ProductCollection } from '../enums/product.enum';
import { Types } from 'mongoose';
type ObjectId = Types.ObjectId;

export interface Product {
	_id: ObjectId;
	productStatus: ProductStatus;
	productCollection?: ProductCollection; // schema'da required false edi
	productName: string;
	productPrice: number;
	productDesc?: string;
	productImages: string[];
	productViews: number; // ✅ schema bilan bir xil
	createdAt: Date;
	updatedAt: Date;
}

export interface ProductInquiry {
	order: string;
	page: number;
	limit: number;
	productCollection?: ProductCollection[];
	search?: string;
}

export interface ProductInput {
	productStatus: string;
	productCollection: string;
	productName: string;
	productPrice: number;
	productDesc?: string;
	productImages: string[];
	productTags?: string[];
}

export interface ProductUpdateInput {
	productStatus?: ProductStatus;
	productName?: string;
	productPrice?: number;
	productDesc?: string;
	productTags?: string[];
	productImages?: string[];
}
