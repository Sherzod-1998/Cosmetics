import { ProductTag } from '../enums/product.enum';

export const PRODUCT_TAG_LABELS: Record<ProductTag, string> = {
	[ProductTag.ANTI_AGING]: 'Ajinga qarshi',
	[ProductTag.BRIGHTENING]: 'Oqartiruvchi',
	[ProductTag.ANTI_ACNE]: 'Ugriga qarshi',
	[ProductTag.FOR_SPOTS]: 'Dog‘lar uchun',
	[ProductTag.FOR_PORES]: 'Poralar uchun',
	[ProductTag.EYE_AREA]: 'Ko‘z atrofi uchun',

	[ProductTag.FOR_OILY_SKIN]: 'Yog‘li yuzlar uchun',
	[ProductTag.FOR_DRY_SKIN]: 'Quruq yuzlar uchun',
	[ProductTag.FOR_ACNE_SKIN]: 'Ugrili yuzlar uchun',

	[ProductTag.FOR_HANDS]: 'Qo‘l uchun',
	[ProductTag.FOR_FEET]: 'Oyoq uchun',
	[ProductTag.FOR_INTIMATE]: 'Intim sohalar uchun',

	[ProductTag.EDIBLE]: 'Istemol qilinadigan',
	[ProductTag.VITAMINS]: 'Vitaminlar',

	// 🟢 COLLECTION / TYPE sifatida ishlatilsa
	[ProductTag.SKINCARE]: 'Teri parvarishi',
	[ProductTag.MAKEUP]: 'Makiyaj',
	[ProductTag.HAIRCARE]: 'Soch parvarishi',
	[ProductTag.PERFUME]: 'Atirlar',
	[ProductTag.SUNCARE]: 'Quyoshdan himoya',
	[ProductTag.OTHER]: 'Boshqa',
};
