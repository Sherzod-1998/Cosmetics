(() => {
	const form = document.querySelector('.filterform');
	if (!form) return;

	const qInput = form.querySelector('input[name="q"]');
	const selects = form.querySelectorAll('select');

	let t = null;
	let controller = null;

	// ---------- PAGINATION STATE ----------
	const pagerEl = document.getElementById('pager');
	const btnPrev = document.getElementById('pgPrev');
	const btnNext = document.getElementById('pgNext');
	const rangeEl = document.getElementById('pgRange');
	const totalEl = document.getElementById('pgTotal');
	const sizeEl = document.getElementById('pgSize');

	let allCards = []; // DOM elements list
	let page = 1;
	let pageSize = Number(sizeEl?.value || 12);

	function getCardsWrap() {
		return document.querySelector('#cardsWrap');
	}

	function collectCards() {
		const wrap = getCardsWrap();
		if (!wrap) return [];

		// Empty state bo'lsa (.empty) - pagination kerak emas
		const empty = wrap.querySelector('.empty');
		if (empty) return [];

		return Array.from(wrap.querySelectorAll('.pCard'));
	}

	function renderPage() {
		const wrap = getCardsWrap();
		if (!wrap) return;

		const total = allCards.length;

		if (!pagerEl) return;

		if (total === 0) {
			pagerEl.hidden = true;
			return;
		}

		pagerEl.hidden = false;

		const totalPages = Math.max(1, Math.ceil(total / pageSize));
		if (page > totalPages) page = totalPages;
		if (page < 1) page = 1;

		const start = (page - 1) * pageSize;
		const end = Math.min(start + pageSize, total);

		// hammasini yashiramiz, faqat keraklilarni ko'rsatamiz
		allCards.forEach((el, idx) => {
			el.style.display = idx >= start && idx < end ? '' : 'none';
		});

		// UI update
		if (rangeEl) rangeEl.textContent = `${start + 1}–${end}`;
		if (totalEl) totalEl.textContent = String(total);

		if (btnPrev) btnPrev.disabled = page <= 1;
		if (btnNext) btnNext.disabled = page >= totalPages;

		// countNote'ni ham "ko'rinayotgan" son bilan yangilab qo'ysak chiroyli bo'ladi
		const countNote = document.getElementById('countNote');
		if (countNote) countNote.textContent = `${end - start} ta mahsulot (jami ${total})`;
	}

	function initPagination(resetToFirst = true) {
		allCards = collectCards();
		if (resetToFirst) page = 1;
		pageSize = Number(sizeEl?.value || pageSize || 12);
		renderPage();
	}

	// pager events
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

	if (sizeEl) {
		sizeEl.addEventListener('change', () => {
			pageSize = Number(sizeEl.value || 12);
			page = 1;
			renderPage();
		});
	}

	// lastQS ni DOM’dan real-time tekshiramiz
	function getQS() {
		return new URLSearchParams(new FormData(form)).toString();
	}

	async function ajaxRefresh() {
		const qs = getQS();
		const url = `${form.getAttribute('action') || location.pathname}?${qs}`;

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

			// ✅ AJAX yangilangandan keyin pagination qayta init
			initPagination(true);
		} catch (err) {
			if (err && err.name === 'AbortError') return;
			console.log(err);
			form.submit();
		}
	}

	// typing (debounce)
	if (qInput) {
		qInput.addEventListener('input', () => {
			clearTimeout(t);
			t = setTimeout(() => {
				page = 1; // qidirishda birinchi sahifaga qaytamiz
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

	// CLEAR FILTERS
	const clearBtn = document.getElementById('clearFilters');

	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			if (qInput) qInput.value = '';

			selects.forEach((s) => {
				s.value = 'ALL';
				if (s.name === 'sort') s.value = 'newest';
			});

			history.replaceState({}, '', '/');
			page = 1;
			ajaxRefresh();
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

	// ✅ first load init
	initPagination(true);
})();
