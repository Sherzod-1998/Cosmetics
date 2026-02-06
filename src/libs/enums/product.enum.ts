export enum ProductStatus {
	PAUSE = 'PAUSE',
	PROCESS = 'PROCESS',
}

export enum ProductCollection {
	// Collections / Category-like
	SKINCARE = 'SKINCARE',
	MAKEUP = 'MAKEUP',
	HAIRCARE = 'HAIRCARE',
	PERFUME = 'PERFUME',
	SUNCARE = 'SUNCARE',
	OTHER = 'OTHER',

	// Effects / Concerns
	ANTI_AGING = 'ANTI_AGING', // ajinga qarshi
	BRIGHTENING = 'BRIGHTENING', // oqartiruvchi
	ANTI_ACNE = 'ANTI_ACNE', // ugridan (ugriga qarshi)
	FOR_SPOTS = 'FOR_SPOTS', // dog'lar uchun
	FOR_PORES = 'FOR_PORES', // poralar uchun
	EYE_AREA = 'EYE_AREA', // ko'z atrofi uchun

	// Skin types / targeting
	FOR_OILY_SKIN = 'FOR_OILY_SKIN', // yog'li yuzlar uchun
	FOR_DRY_SKIN = 'FOR_DRY_SKIN', // quruq yuzlar uchun
	FOR_ACNE_SKIN = 'FOR_ACNE_SKIN', // ugridan aziyat chekadigan yuz

	// Usage areas
	FOR_HANDS = 'FOR_HANDS', // qo'l uchun
	FOR_FEET = 'FOR_FEET', // oyoq uchun
	FOR_INTIMATE = 'FOR_INTIMATE', // intim sohalar uchun

	// Edible / supplements
	EDIBLE = 'EDIBLE', // istemol qilinadigan
	VITAMINS = 'VITAMINS',
}

export enum ProductTag {
	// Collection / Type
	SKINCARE = 'SKINCARE',
	MAKEUP = 'MAKEUP',
	HAIRCARE = 'HAIRCARE',
	PERFUME = 'PERFUME',
	SUNCARE = 'SUNCARE',
	OTHER = 'OTHER',

	// Effects / concerns
	ANTI_AGING = 'ANTI_AGING', // ajinga qarshi
	BRIGHTENING = 'BRIGHTENING', // oqartiruvchi
	ANTI_ACNE = 'ANTI_ACNE', // ugriga qarshi
	FOR_SPOTS = 'FOR_SPOTS', // dog'lar uchun
	FOR_PORES = 'FOR_PORES', // poralar uchun
	EYE_AREA = 'EYE_AREA', // ko'z atrofi uchun
	MOISTURIZING = 'MOISTURIZING', // 💧 namlantiruvchi
	COLLAGEN = 'COLLAGEN', // 🧬 kollagen

	// Skin targeting
	FOR_OILY_SKIN = 'FOR_OILY_SKIN', // yog'li yuzlar uchun
	FOR_DRY_SKIN = 'FOR_DRY_SKIN', // quruq yuzlar uchun
	FOR_ACNE_SKIN = 'FOR_ACNE_SKIN', // ugrili yuzlar uchun

	// Areas
	FOR_HANDS = 'FOR_HANDS', // qo'l uchun
	FOR_FEET = 'FOR_FEET', // oyoq uchun
	FOR_INTIMATE = 'FOR_INTIMATE', // intim sohalar uchun
	FACE_CLEANSER = 'FACE_CLEANSER', // 🧼 yuz tozalovchi

	// Hair
	SHAMPOO = 'SHAMPOO', // 🧴 shampun

	// Makeup items
	LIPSTICK = 'LIPSTICK', // 💄 pomada

	// Edible / Medical
	EDIBLE = 'EDIBLE', // istemol qilinadigan
	VITAMINS = 'VITAMINS', // vitaminlar
	LACTOFIT = 'LACTOFIT', // 🦠 lactofitlar (probiotik)
	MEDICINE = 'MEDICINE', // 💊 dorilar
}
