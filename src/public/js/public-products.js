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

	/* PAGINATION */
	const pagerEl = document.getElementById('pager');
	const btnPrev = document.getElementById('pgPrev');
	const btnNext = document.getElementById('pgNext');

	let allCards = [];
	let page = 1;
	const pageSize = 8;

	function getCardsWrap() {
		return document.querySelector('#cardsWrap');
	}

	function collectCards() {
		const wrap = getCardsWrap();
		if (!wrap) return [];

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

		allCards.forEach((el, idx) => {
			el.style.display = idx >= start && idx < end ? '' : 'none';
		});

		pagerEl.hidden = totalPages <= 1;

		if (btnPrev) btnPrev.disabled = page <= 1;
		if (btnNext) btnNext.disabled = page >= totalPages;

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
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}

	if (btnNext) {
		btnNext.addEventListener('click', () => {
			page += 1;
			renderPage();
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}

	/* AJAX REFRESH */
	function getQS() {
		return new URLSearchParams(new FormData(form)).toString();
	}

	async function ajaxRefresh() {
		const qs = getQS();
		const action = form.getAttribute('action') || location.pathname;
		const url = `${action}?${qs}`;

		history.replaceState({}, '', url);

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

			if (!newCards || !curCards) {
				form.submit();
				return;
			}

			curCards.innerHTML = newCards.innerHTML;

			if (newCount && curCount) {
				curCount.innerHTML = newCount.innerHTML;
			}

			initPagination(true);
		} catch (err) {
			if (err && err.name === 'AbortError') return;
			console.log(err);
			form.submit();
		}
	}

	/* EVENTS */
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

	selects.forEach((s) => {
		s.addEventListener('change', () => {
			clearTimeout(t);
			page = 1;
			ajaxRefresh();
		});
	});

	/* CLEAR FILTERS */
	const clearBtn = document.getElementById('clearFilters');
	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			if (qInput) qInput.value = '';

			selects.forEach((s) => {
				if (s.name === 'tag') s.value = 'ALL';
				if (s.name === 'sort') s.value = 'newest';
			});

			// ✅ action qayer bo‘lsa, o‘sha yerga tozalab qaytadi
			const action = form.getAttribute('action') || '/products';
			history.replaceState({}, '', action);

			page = 1;
			ajaxRefresh();
		});
	}

	initPagination(true);
})();
