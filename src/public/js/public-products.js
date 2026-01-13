(() => {
	const form = document.querySelector('.filterform');
	if (!form) return;

	const qInput = form.querySelector('input[name="q"]');
	const selects = form.querySelectorAll('select');

	let t = null;
	let controller = null;

	// lastQS ni DOM’dan real-time tekshiramiz (avvalgi xato shu yerda edi)
	function getQS() {
		return new URLSearchParams(new FormData(form)).toString();
	}

	async function ajaxRefresh() {
		const qs = getQS();
		const url = `${form.getAttribute('action') || location.pathname}?${qs}`;

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
		} catch (err) {
			if (err && err.name === 'AbortError') return;
			console.log(err);

			// internet/parse muammo bo‘lsa ham user ishlata olsin
			form.submit();
		}
	}

	// typing (debounce)
	if (qInput) {
		qInput.addEventListener('input', () => {
			clearTimeout(t);
			t = setTimeout(ajaxRefresh, 300);
		});

		qInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				clearTimeout(t);
				e.preventDefault();
				ajaxRefresh();
			}
		});
	}

	// CLEAR FILTERS
	const clearBtn = document.getElementById('clearFilters');

	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			// inputni tozalaymiz
			if (qInput) qInput.value = '';

			// selectlarni default holatga qaytaramiz
			selects.forEach((s) => {
				s.value = 'ALL'; // tag uchun
				if (s.name === 'sort') s.value = 'newest';
			});

			// URL’ni tozalaymiz
			history.replaceState({}, '', '/');

			// AJAX bilan yangilaymiz
			ajaxRefresh();
		});
	}

	// select change
	selects.forEach((s) => {
		s.addEventListener('change', () => {
			clearTimeout(t);
			ajaxRefresh();
		});
	});
})();
