/* /js/public-products.js
   - AJAX filter/search refresh
   - Clear filters
   - Client-side pagination: ONLY Prev/Next, 8 items per page
*/

(() => {
	const form = document.querySelector('.filterform');
	if (!form) return;

	const qInput = form.querySelector('input[name="q"]');
	const selects = form.querySelectorAll('select');

	let t = null;
	let controller = null;

	/* =========================
     PAGINATION (prev/next only)
     ========================= */
	const pagerEl = document.getElementById('pager');
	const btnPrev = document.getElementById('pgPrev');
	const btnNext = document.getElementById('pgNext');

	let allCards = [];
	let page = 1;
	const pageSize = 8; // ✅ har pageda 8 ta

	function getCardsWrap() {
		return document.querySelector('#cardsWrap');
	}

	function collectCards() {
		const wrap = getCardsWrap();
		if (!wrap) return [];

		// empty state bo‘lsa pagination ko‘rsatmaymiz
		const empty = wrap.querySelector('.empty');
		if (empty) return [];

		return Array.from(wrap.querySelectorAll('.pCard'));
	}

	function renderPage() {
		const total = allCards.length;

		if (!pagerEl) return;

		if (total === 0) {
			pagerEl.hidden = true;
			return;
		}

		const totalPages = Math.max(1, Math.ceil(total / pageSize));
		if (page > totalPages) page = totalPages;
		if (page < 1) page = 1;

		const start = (page - 1) * pageSize;
		const end = Math.min(start + pageSize, total);

		// hammasini yashiramiz, faqat keraklilarni ko‘rsatamiz
		allCards.forEach((el, idx) => {
			el.style.display = idx >= start && idx < end ? '' : 'none';
		});

		// 1 sahifa bo‘lsa tugmalarni ham yashiramiz
		pagerEl.hidden = totalPages <= 1;

		if (btnPrev) btnPrev.disabled = page <= 1;
		if (btnNext) btnNext.disabled = page >= totalPages;

		// countNote ni "ko‘rinayotgan" + jami qilib chiqaramiz
		const countNote = document.getElementById('countNote');
		if (countNote) countNote.textContent = `${end - start} ta mahsulot (jami ${total})`;
	}

	function initPagination(resetToFirst = true) {
		allCards = collectCards();
		if (resetToFirst) page = 1;
		renderPage();
	}

	if (btnPrev) {
		btnPrev.addEventListener('click', () => {
			page -= 1;
			renderPage();

			// tepaga yumshoq qaytish
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}

	if (btnNext) {
		btnNext.addEventListener('click', () => {
			page += 1;
			renderPage();

			// tepaga yumshoq qaytish
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}

	/* =========================
     AJAX REFRESH
     ========================= */

	// formdagi qiymatlarni real-time querystring qilib olamiz
	function getQS() {
		return new URLSearchParams(new FormData(form)).toString();
	}

	async function ajaxRefresh() {
		const qs = getQS();
		const action = form.getAttribute('action') || location.pathname;
		const url = `${action}?${qs}`;

		// URL’ni reloadsiz yangilab qo‘yamiz
		history.replaceState({}, '', url);

		// oldingi request bo‘lsa cancel
		if (controller) controller.abort();
		controller = new AbortController();

		try {
			const res = await fetch(url, {
				headers: { 'X-Requested-With': 'XMLHttpRequest' },
				signal: controller.signal,
			});

			const html = await res.text();
			const doc = new DOMParser().parseFromString(html, 'text/html');

			const newCards = doc.querySelector('#cardsWrap');
			const curCards = document.querySelector('#cardsWrap');

			const newCount = doc.querySelector('#countNote');
			const curCount = document.querySelector('#countNote');

			// agar serverdan kutilgan DOM kelmasa => fallback full submit
			if (!newCards || !curCards) {
				form.submit();
				return;
			}

			curCards.innerHTML = newCards.innerHTML;

			if (newCount && curCount) {
				curCount.innerHTML = newCount.innerHTML;
			}

			// ✅ yangi cardlar kelgandan keyin pagination qayta ishlasin
			initPagination(true);
		} catch (err) {
			if (err && err.name === 'AbortError') return;
			console.log(err);

			// internet/parse muammo bo‘lsa ham user ishlata olsin
			form.submit();
		}
	}

	/* =========================
     EVENTS
     ========================= */

	// typing (debounce)
	if (qInput) {
		qInput.addEventListener('input', () => {
			clearTimeout(t);
			t = setTimeout(() => {
				page = 1;
				ajaxRefresh();
			}, 300);
		});

		qInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				clearTimeout(t);
				e.preventDefault();
				page = 1;
				ajaxRefresh();
			}
		});
	}

	// select change
	selects.forEach((s) => {
		s.addEventListener('change', () => {
			clearTimeout(t);
			page = 1;
			ajaxRefresh();
		});
	});

	// CLEAR FILTERS
	const clearBtn = document.getElementById('clearFilters');

	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			// q ni tozalaymiz
			if (qInput) qInput.value = '';

			// selectlarni default holatga qaytaramiz
			selects.forEach((s) => {
				if (s.name === 'tag') s.value = 'ALL';
				if (s.name === 'sort') s.value = 'newest';
			});

			// URL’ni tozalaymiz (action "/")
			history.replaceState({}, '', '/');

			// paginationni 1 ga tushiramiz
			page = 1;

			// AJAX bilan yangilaymiz
			ajaxRefresh();
		});
	}

	/* =========================
     FIRST LOAD
     ========================= */
	initPagination(true);
})();
