/* /js/public-products.js
   - AJAX filter/search refresh
   - Clear filters
   - BACKEND pagination: ONLY Prev/Next (page/limit query orqali)
*/
(() => {
	const form = document.querySelector('.filterform');
	if (!form) return;

	const qInput = form.querySelector('input[name="q"]');
	const selects = form.querySelectorAll('select');

	const pageInput = form.querySelector('input[name="page"]');
	const limitInput = form.querySelector('input[name="limit"]');

	// ✅ agar hidden inputlar yo'q bo'lsa, o'zimiz qo'shib qo'yamiz (fail-safe)
	if (!pageInput) {
		const inp = document.createElement('input');
		inp.type = 'hidden';
		inp.name = 'page';
		inp.value = '1';
		form.prepend(inp);
	}
	if (!limitInput) {
		const inp = document.createElement('input');
		inp.type = 'hidden';
		inp.name = 'limit';
		inp.value = '8';
		form.prepend(inp);
	}

	const pageEl = form.querySelector('input[name="page"]');
	const limitEl = form.querySelector('input[name="limit"]');

	let t = null;
	let controller = null;

	function getAction() {
		return form.getAttribute('action') || location.pathname;
	}

	function getQS() {
		return new URLSearchParams(new FormData(form)).toString();
	}

	function setPage(n) {
		const v = Math.max(1, Number(n || 1));
		pageEl.value = String(v);
	}

	async function ajaxRefresh({ scrollTop = false } = {}) {
		const qs = getQS();
		const action = getAction();
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

			const newPager = doc.querySelector('#pager');
			const curPager = document.querySelector('#pager');

			const newPageInput = doc.querySelector('input[name="page"]');
			const newLimitInput = doc.querySelector('input[name="limit"]');

			if (!newCards || !curCards) {
				form.submit();
				return;
			}

			curCards.innerHTML = newCards.innerHTML;

			if (newCount && curCount) curCount.innerHTML = newCount.innerHTML;

			if (newPager && curPager) curPager.outerHTML = newPager.outerHTML;

			if (newPageInput) pageEl.value = newPageInput.value || pageEl.value;
			if (newLimitInput) limitEl.value = newLimitInput.value || limitEl.value;

			if (typeof window.initSwipers === 'function') window.initSwipers();

			if (scrollTop) window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch (err) {
			if (err && err.name === 'AbortError') return;
			console.log(err);
			form.submit();
		}
	}

	/* SEARCH */
	if (qInput) {
		qInput.addEventListener('input', () => {
			clearTimeout(t);
			t = setTimeout(() => {
				setPage(1);
				ajaxRefresh();
			}, 300);
		});

		qInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				clearTimeout(t);
				e.preventDefault();
				setPage(1);
				ajaxRefresh();
			}
		});
	}

	/* SELECTS */
	selects.forEach((s) => {
		s.addEventListener('change', () => {
			clearTimeout(t);
			setPage(1);
			ajaxRefresh();
		});
	});

	/* PREV/NEXT (delegation) */
	document.addEventListener('click', (e) => {
		const prev = e.target.closest('#pgPrev');
		const next = e.target.closest('#pgNext');
		if (!prev && !next) return;

		e.preventDefault();

		const cur = Number(pageEl.value || 1);

		if (prev) {
			if (prev.disabled) return;
			setPage(cur - 1);
			ajaxRefresh({ scrollTop: true });
			return;
		}

		if (next) {
			if (next.disabled) return;
			setPage(cur + 1);
			ajaxRefresh({ scrollTop: true });
		}
	});

	/* CLEAR */
	const clearBtn = document.getElementById('clearFilters');
	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			if (qInput) qInput.value = '';

			selects.forEach((s) => {
				if (s.name === 'tag') s.value = 'ALL';
				if (s.name === 'sort') s.value = 'newest';
			});

			setPage(1);
			limitEl.value = '8';

			history.replaceState({}, '', getAction());
			ajaxRefresh({ scrollTop: true });
		});
	}
})();
