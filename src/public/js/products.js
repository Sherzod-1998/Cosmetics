/* eslint-disable @typescript-eslint/no-unused-vars */
console.log('Products frontend javascript file');

$(function () {
	// CREATE open/close
	$('#openCreateBtn').on('click', () => {
		$('#createBox').addClass('open');
		$('#createBox')[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
	});
	$('#closeCreateBtn').on('click', () => $('#createBox').removeClass('open'));
	$('#cancel-btn').on('click', () => $('#createBox').removeClass('open'));

	// EDIT open/close
	$('#closeEditBtn').on('click', closeEdit);
	$('#cancelEditBtn').on('click', closeEdit);

	// STATUS UPDATE (axios JSON)
	$(document).on('change', '.new-product-status', async function (e) {
		const id = e.target.id;
		const productStatus = $(this).val();

		try {
			const response = await axios.post(`/admin/product/${id}`, { productStatus });
			const result = response.data;
			if (result && result.data) {
				$(this).blur();
			} else {
				alert('Holatni yangilashda xato!');
			}
		} catch (err) {
			console.log(err);
			alert('Holatni yangilashda xato!');
		}
	});

	// EDIT FORM SUBMIT (multipart) -> API JSON qaytaradi, shuning uchun JS bilan yuboramiz
	const editForm = document.getElementById('editForm');
	if (editForm) {
		editForm.addEventListener('submit', async (evt) => {
			evt.preventDefault();

			if (!window.__editId) return alert('ID topilmadi!');

			try {
				const formData = new FormData(editForm);

				// API: POST /admin/product/:id
				const res = await axios.post(`/admin/product/${window.__editId}`, formData, {
					headers: { 'Content-Type': 'multipart/form-data' },
				});

				if (res.data && res.data.data) {
					alert('Mahsulot yangilandi!');
					// sahifani qayta yuklaymiz (filter query saqlanadi)
					window.location.reload();
				} else {
					alert('Yangilashda xato!');
				}
			} catch (err) {
				console.log(err);
				alert('Yangilashda xato!');
			}
		});
	}
});

// CREATE validate (minimal)
function validateCreateForm() {
	const name = $('input[name="productName"]').val();
	const price = $('input[name="productPrice"]').val();
	if (!name || !price) {
		alert('Iltimos, nom va narxni kiriting!');
		return false;
	}
	return true;
}

// CREATE preview
function previewFileHandler(input, order) {
	const file = input.files && input.files[0];
	if (!file) return;

	const validImageType = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];
	if (!validImageType.includes(file.type)) {
		alert('Faqat jpg, jpeg, png (va webp) rasm yuklang!');
		input.value = '';
		return;
	}

	const reader = new FileReader();
	reader.onload = function () {
		const imgEl = document.getElementById(`image-section-${order}`);
		if (imgEl) imgEl.src = reader.result;
	};
	reader.readAsDataURL(file);
}

/* =========================
   EDIT LOGIC
========================= */

window.__editId = null;

// buttondan product object olish (data-product ichidan)
function openEditFromBtn(btnEl) {
	try {
		const encoded = btnEl.getAttribute('data-product');
		const product = JSON.parse(decodeURIComponent(encoded));
		openEdit(product);
	} catch (e) {
		console.log(e);
		alert('Edit ochishda xato!');
	}
}

function openEdit(product) {
	window.__editId = product._id;

	// fields
	document.getElementById('editName').value = product.productName || '';
	document.getElementById('editPrice').value = product.productPrice || '';
	document.getElementById('editDesc').value = product.productDesc || '';
	document.getElementById('editStatus').value = product.productStatus || 'PAUSE';

	// tags checkbox
	document.querySelectorAll('#editTagsGrid input[name="productTags"]').forEach((cb) => {
		cb.checked = Array.isArray(product.productTags) && product.productTags.includes(cb.value);
	});

	// existing images preview
	const existingWrap = document.getElementById('existingImages');
	existingWrap.innerHTML = '';
	if (product.productImages && product.productImages.length) {
		product.productImages.forEach((img) => {
			const el = document.createElement('img');
			el.src = '/' + img;
			el.className = 'thumb';
			el.style.width = '70px';
			el.style.height = '70px';
			el.style.objectFit = 'cover';
			el.style.marginRight = '8px';
			el.style.borderRadius = '12px';
			el.onerror = function () {
				this.style.display = 'none';
			};
			existingWrap.appendChild(el);
		});
	} else {
		existingWrap.innerHTML = '<span class="muted">Rasm yo‘q</span>';
	}

	// reset edit upload previews + file inputs
	for (let i = 1; i <= 5; i++) {
		const img = document.getElementById(`edit-image-${i}`);
		if (img) img.src = '/img/upload.svg';

		// file inputni reset qilish
		const input = document.querySelector(`#editBox input[type="file"][name="productImage"]:nth-of-type(${i})`);
		// nth-of-type bu yerda ishonchsiz bo‘lishi mumkin — shuning uchun umumiy reset:
	}
	document.querySelectorAll('#editBox input[type="file"]').forEach((inp) => (inp.value = ''));

	// open modal
	document.getElementById('editBox').classList.add('open');
	document.getElementById('editBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeEdit() {
	document.getElementById('editBox').classList.remove('open');
	window.__editId = null;
}

// EDIT preview (edit-image-1..5)
function previewEditImage(input, idx) {
	const file = input.files && input.files[0];
	if (!file) return;

	const validImageType = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];
	if (!validImageType.includes(file.type)) {
		alert('Faqat jpg, jpeg, png (va webp) rasm yuklang!');
		input.value = '';
		return;
	}

	const reader = new FileReader();
	reader.onload = function () {
		const imgEl = document.getElementById(`edit-image-${idx}`);
		if (imgEl) imgEl.src = reader.result;
	};
	reader.readAsDataURL(file);
}

async function deleteProduct(id, name) {
	const ok = confirm(`"${name}" mahsulotini butunlay o‘chirmoqchimisiz?\nBu amal qaytarilmaydi!`);
	if (!ok) return;

	try {
		const res = await axios.delete(`/admin/product/${id}`);
		if (res.data && res.data.ok) {
			alert('Mahsulot o‘chirildi');
			window.location.reload();
		} else {
			alert('O‘chirishda xato!');
		}
	} catch (err) {
		console.log(err);
		alert('O‘chirishda xato!');
	}
}

(() => {
	const form = document.querySelector('.filterform');
	if (!form) return;

	const qInput = form.querySelector('input[name="q"]');
	const selects = form.querySelectorAll('select');

	// Sahifani keraksiz qayta yuklamaslik uchun:
	// - typingda 350ms kutadi
	// - aynan bir xil query bo‘lsa submit qilmaydi
	let t = null;
	let lastQS = new URLSearchParams(new FormData(form)).toString();

	const submitIfChanged = () => {
		const qs = new URLSearchParams(new FormData(form)).toString();
		if (qs === lastQS) return;
		lastQS = qs;
		form.submit();
	};

	// 1) Harf-harf qidiruv (debounce)
	if (qInput) {
		qInput.addEventListener('input', () => {
			clearTimeout(t);
			t = setTimeout(submitIfChanged, 350);
		});

		// ixtiyoriy: Enter bosilsa darhol
		qInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				clearTimeout(t);
				e.preventDefault();
				submitIfChanged();
			}
		});
	}

	// 2) Filterlar (select) o‘zgarganda darhol
	selects.forEach((s) => {
		s.addEventListener('change', () => {
			clearTimeout(t);
			submitIfChanged();
		});
	});
})();

(() => {
	const params = new URLSearchParams(location.search);
	if (params.get('q')) {
		const qInput = document.querySelector('.filterform input[name="q"]');
		if (qInput) {
			qInput.focus();
			qInput.setSelectionRange(qInput.value.length, qInput.value.length);
		}
	}
})();
