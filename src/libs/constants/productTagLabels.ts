import { ProductTag } from '../enums/product.enum';

export const PRODUCT_TAG_LABELS: Record<ProductTag, string> = {
	// Effects
	[ProductTag.ANTI_AGING]: 'Ajinga qarshi',
	[ProductTag.BRIGHTENING]: 'Oqartiruvchi',
	[ProductTag.ANTI_ACNE]: 'Ugriga qarshi',
	[ProductTag.FOR_SPOTS]: 'Dog‘lar uchun',
	[ProductTag.FOR_PORES]: 'Poralar uchun',
	[ProductTag.EYE_AREA]: 'Ko‘z atrofi uchun',
	[ProductTag.MOISTURIZING]: 'Namlantiruvchi',
	[ProductTag.COLLAGEN]: 'Kollagenli',

	// Skin type
	[ProductTag.FOR_OILY_SKIN]: 'Yog‘li teri uchun',
	[ProductTag.FOR_DRY_SKIN]: 'Quruq teri uchun',
	[ProductTag.FOR_ACNE_SKIN]: 'Ugrili teri uchun',

	// Areas
	[ProductTag.FOR_HANDS]: 'Qo‘l uchun',
	[ProductTag.FOR_FEET]: 'Oyoq uchun',
	[ProductTag.FOR_INTIMATE]: 'Intim sohalar uchun',
	[ProductTag.FACE_CLEANSER]: 'Yuz tozalovchi',

	// Hair
	[ProductTag.SHAMPOO]: 'Shampun',

	// Makeup
	[ProductTag.LIPSTICK]: 'Pomada',

	// Edible / Medical
	[ProductTag.EDIBLE]: 'Istemol qilinadigan',
	[ProductTag.VITAMINS]: 'Vitaminlar',
	[ProductTag.LACTOFIT]: 'Lactofitlar',
	[ProductTag.MEDICINE]: 'Dorilar',

	// Collection / Type
	[ProductTag.SKINCARE]: 'Teri parvarishi',
	[ProductTag.MAKEUP]: 'Makiyaj',
	[ProductTag.HAIRCARE]: 'Soch parvarishi',
	[ProductTag.PERFUME]: 'Atirlar',
	[ProductTag.SUNCARE]: 'Quyoshdan himoya',
	[ProductTag.OTHER]: 'Boshqa',
};
