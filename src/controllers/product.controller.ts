import Errors, { HttpCode, Message } from '../libs/Errors';
import { Request, Response } from 'express';
import { T } from '../libs/types/common';
import ProductService from '../models/Product.service';
import { AdminRequest, ExtendedRequest } from '../libs/types/member';
import { ProductInput, ProductInquiry } from '../libs/types/product';
import { ProductCollection, ProductStatus, ProductTag } from '../libs/enums/product.enum';
import { PRODUCT_TAG_LABELS } from '../libs/constants/productTagLabels';

const productService = new ProductService();

const productController: T = {};

productController.getProducts = async (req: Request, res: Response) => {
	try {
		console.log('getProducts');

		const { page, limit, order, productCollection, search } = req.query;

		const inquiry: ProductInquiry = {
			order: String(order),
			page: Number(page),
			limit: Number(limit),
		};

		// ✅ productCollection ni array ko‘rinishida to‘g‘ri tiplab olish
		if (productCollection) {
			if (Array.isArray(productCollection)) {
				inquiry.productCollection = productCollection as ProductCollection[];
			} else if (typeof productCollection === 'string') {
				inquiry.productCollection = [productCollection as ProductCollection];
			}
		}

		// Optional search
		if (search) inquiry.search = String(search);

		const result = await productService.getProducts(inquiry);

		console.log('result', result);

		res.status(HttpCode.OK).json(result);
	} catch (err) {
		console.log('Error, getProducts:', err);

		if (err instanceof Errors) {
			res.status(err.code).json(err);
		} else {
			res.status(Errors.standard.code).json(Errors.standard);
		}
	}
};

productController.getProduct = async (req: ExtendedRequest, res: Response) => {
	try {
		console.log('getProduct');
		const { id } = req.params;

		const memberId = req.member?._id ?? null;
		const result = await productService.getProduct(memberId, id);
		res.status(HttpCode.OK).json(result);
	} catch (err) {
		console.log('Error, getProduct:', err);
		if (err instanceof Errors) {
			res.status(err.code).json(err);
		} else {
			res.status(Errors.standard.code).json(Errors.standard);
		}
	}
};

productController.getAllProducts = async (req: Request, res: Response) => {
	try {
		console.log('getAllProducts');

		const q = (req.query.q as string) || '';
		const tag = (req.query.tag as string) || 'ALL';
		const status = (req.query.status as string) || 'ALL';
		const hasImage = (req.query.hasImage as string) || 'ALL'; // ✅ qo‘shildi
		const sort = (req.query.sort as string) || 'newest';

		const data = await productService.getAllProducts({ q, tag, status, hasImage, sort });

		res.render('products', {
			products: data,

			// EJS formda qiymatlarni saqlab turish uchun
			filters: { q, tag, status, hasImage, sort }, // ✅ qo‘shildi

			productTagsEnum: Object.values(ProductTag),
			productStatusEnum: Object.values(ProductStatus),
			productTagLabels: PRODUCT_TAG_LABELS,
		});
	} catch (err) {
		console.log('Error getAllProducts', err);
		if (err instanceof Errors) {
			res.status(err.code).json(err);
		} else {
			res.status(Errors.standard.code).json(Errors.standard);
		}
	}
};

productController.getPublicProducts = async (req: Request, res: Response) => {
	try {
		const q = String(req.query.q || '');
		const tag = String(req.query.tag || 'ALL');
		const sort = String(req.query.sort || 'newest');

		const products = await productService.getPublicProducts({ q, tag, sort });

		return res.render('public/products', {
			products,
			filters: { q, tag, sort },
			productTagsEnum: Object.values(ProductTag),
			productTagLabels: PRODUCT_TAG_LABELS,
		});
	} catch (err) {
		console.log('getPublicProducts error:', err);
		return res.status(500).send('Server error');
	}
};

productController.recommendProducts = async (req: Request, res: Response) => {
	try {
		const { productId } = req.params;

		const result = await productService.getRecommendedProducts(productId);

		res.status(200).json(result);
	} catch (err) {
		console.log('Error, recommendProducts:', err);
		res.status(500).json({ message: 'Internal server error' });
	}
};

productController.createNewProduct = async (req: AdminRequest, res: Response) => {
	try {
		console.log('createNewProducts');
		console.log('req.body:', req.body);

		if (!req.files?.length) {
			throw new Errors(HttpCode.INTERNAL_SERVER_ERROR, Message.CREATE_FAILED);
		}

		const data: ProductInput = req.body;

		// ✅ 1) images
		data.productImages = req.files.map((ele) => ele.path.replace(/\\/g, '/'));

		// ✅ 2) tags (checkbox normalize)
		const tagsRaw = (req.body as any).productTags;
		data.productTags = Array.isArray(tagsRaw) ? tagsRaw : tagsRaw ? [tagsRaw] : [];

		// ✅ 3) number fields (ba'zan string bo'lib keladi)
		data.productPrice = Number((req.body as any).productPrice);

		await productService.createNewProduct(data);

		res.send(`<script> alert("Successful creation!"); window.location.replace('/admin/product/all') </script>`);
	} catch (err) {
		console.log('Error createNewProducts', err);
		const message = err instanceof Errors ? err.message : Message.SOMETHING_WENT_WRONG;
		res.send(`<script> alert("${message}"); window.location.replace('/admin/product/all') </script>`);
	}
};

productController.updateChosenProduct = async (req: Request, res: Response) => {
	try {
		console.log('updateChosenProduct');
		const id = req.params.id;

		// ✅ multer array() -> req.files
		const files = (req.files as Express.Multer.File[]) || [];

		// ✅ agar yangi rasm(lar) kelsa, DBga yozish uchun body ga qo‘shamiz
		if (files.length) {
			const newImages = files.map((f) => (f.path || '').replace(/\\/g, '/'));
			// f.path: masalan "uploads/products/abc.jpg"

			// Variant A: yangi rasmlar kelsa, eski rasmlarni to‘liq almashtirish
			req.body.productImages = newImages;

			// Variant B: yangi rasmlarni eski rasmlar ustiga qo‘shib yuborish (append) — pastda service’da qilamiz
			// req.body.__newImages = newImages; // xohlasangiz shunday yuborib, service’da merge qiling
		}

		const result = await productService.updateChosenProduct(id, req.body);
		res.status(HttpCode.OK).json({ data: result });
	} catch (err) {
		console.log('Error updateChosenProduct', err);
		if (err instanceof Errors) {
			res.status(err.code).json(err);
		} else {
			res.status(Errors.standard.code).json(Errors.standard);
		}
	}
};

productController.deleteProduct = async (req: Request, res: Response) => {
	try {
		const id = req.params.id;
		await productService.deleteProduct(id);
		res.status(200).json({ ok: true });
	} catch (err) {
		console.log('deleteProduct error', err);
		res.status(400).json({ ok: false });
	}
};

export default productController;
