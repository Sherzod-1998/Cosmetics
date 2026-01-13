(() => {
	const form = document.querySelector('.filterform');
	if (!form) return;

	const qInput = form.querySelector('input[name="q"]');
	const selects = form.querySelectorAll('select');

	let t = null;
	let lastQS = new URLSearchParams(new FormData(form)).toString();
	let controller = null;

	async function ajaxRefresh() {
		const qs = new URLSearchParams(new FormData(form)).toString();
		if (qs === lastQS) return;
		lastQS = qs;

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

			const newCards = doc.querySelector('.cards-wrap');
			const curCards = document.querySelector('.cards-wrap');
			const newCount = doc.querySelector('.card-note');
			const curCount = document.querySelector('.card-note');

			if (newCards && curCards) curCards.innerHTML = newCards.innerHTML;
			if (newCount && curCount) curCount.innerHTML = newCount.innerHTML;
		} catch (err) {
			if (err?.name === 'AbortError') return;
			console.log(err);
		}
	}

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

	selects.forEach((s) => {
		s.addEventListener('change', () => {
			clearTimeout(t);
			ajaxRefresh();
		});
	});
})();
