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

	document.getElementById('editName').value = product.productName || '';
	document.getElementById('editPrice').value = product.productPrice || '';
	document.getElementById('editDesc').value = product.productDesc || '';
	document.getElementById('editStatus').value = product.productStatus || 'PAUSE';

	// tags checkbox
	document.querySelectorAll('#editTagsGrid input[name="productTags"]').forEach((cb) => {
		cb.checked = Array.isArray(product.productTags) && product.productTags.includes(cb.value);
	});

	const imgs = Array.isArray(product.productImages) ? product.productImages : [];

	// ✅ backendga eski rasmlar ro'yxati ketadi
	const hidden = document.getElementById('existingImagesJson');
	if (hidden) hidden.value = JSON.stringify(imgs);

	// ✅ 5 slot preview
	for (let i = 0; i < 5; i++) {
		const imgEl = document.getElementById(`edit-image-${i}`);
		if (!imgEl) continue;

		const raw = imgs[i];
		if (raw) {
			const src = raw.startsWith('http') ? raw : raw.startsWith('/') ? raw : '/' + raw;
			imgEl.src = src;
		} else {
			imgEl.src = '/img/upload.svg';
		}
	}

	// ✅ edit file inputlarni reset
	document.querySelectorAll('#editBox input[type="file"]').forEach((inp) => (inp.value = ''));

	// existingImages (ixtiyoriy galeraya ham chiqarish)
	const existingWrap = document.getElementById('existingImages');
	existingWrap.innerHTML = '';
	if (imgs.length) {
		imgs.forEach((raw) => {
			const src = raw.startsWith('http') ? raw : raw.startsWith('/') ? raw : '/' + raw;
			const el = document.createElement('img');
			el.src = src;
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

	document.getElementById('editBackdrop').classList.add('open');
	document.body.classList.add('modal-open');

	const box = document.getElementById('editBox');
	box.classList.add('open');

	const form = box.querySelector('.form');
	if (form) form.scrollTop = 0;
}

function closeEdit() {
	const box = document.getElementById('editBox');
	box.classList.remove('open');

	const bd = document.getElementById('editBackdrop');
	if (bd) bd.classList.remove('open');

	document.body.classList.remove('modal-open');
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

		// ✅ universal success check
		if (res.status === 200 && (res.data?.ok === true || res.data?.data || res.data?.result)) {
			alert('Mahsulot o‘chirildi');
			window.location.reload();
			return;
		}

		// agar backend oddiy {ok:true} yuborsa ham
		if (res.data?.ok === true) {
			alert('Mahsulot o‘chirildi');
			window.location.reload();
			return;
		}

		alert('O‘chirishda xato!');
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

document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') closeEdit();
});

$(document).on('click', '.js-delete-product', function () {
	const id = this.dataset.id;
	const name = this.dataset.name || '';
	deleteProduct(id, name);
});
