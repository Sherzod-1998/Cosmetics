console.log('Users frontend javascript file');

/* ===========================
   STATUS UPDATE (DELEGATION)
=========================== */
$(document).on('change', '.member-status', async function (e) {
	const id = e.target.id;
	const memberStatus = $(this).val();

	try {
		const res = await axios.post('/admin/user/edit', {
			_id: id,
			memberStatus,
		});

		if (res.data && res.data.data) {
			$(this).blur();
		}
	} catch (err) {
		console.log(err);
	}
});

/* ===========================
   AJAX FILTER (SEARCH + STATUS)
=========================== */
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

		const url = `${form.action}?${qs}`;
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

			const newTable = doc.querySelector('.user-table');
			const currentTable = document.querySelector('.user-table');

			if (newTable && currentTable) {
				currentTable.innerHTML = newTable.innerHTML;
			}
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
	}

	selects.forEach((s) => {
		s.addEventListener('change', () => {
			clearTimeout(t);
			ajaxRefresh();
		});
	});
})();
