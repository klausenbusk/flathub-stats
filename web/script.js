let chart;
let refs = new Set();
let stats;
let ref;
let interval;
let downloadType;
let min = null;

function initChart() {
	let ctx = document.getElementById("chart").getContext("2d");
	chart = new Chart(ctx, {
		// The type of chart we want to create
		type: "line",

		// Configuration options go here
		options: {
			scales: {
				xAxes: [{
					type: "time",
					ticks: {}
				}]
			},
			tooltips: {
				mode: "x",
				intersect: false
			}
		}
	});
}

function updateBasicStats() {
	let total = 0;
	let average = 0;
	let first = null;
	chart.data.datasets.forEach((dataset) => {
		dataset.data.forEach((dataPoint) => {
			if (!min || min <= dataPoint.x) {
				total += dataPoint.y;
				if (!first || dataPoint.x < first) {
					first = dataPoint.x;
				}
			}
		})
	});
	average = total / Math.round(((new Date()) - first) / (24*60*60*1000));
	document.getElementById("basic-stats").textContent = `Total: ${total} downloads | Average: ${average.toFixed(2)} downloads per day`;
}

function updateDatasets() {
	let chartColors = [
		"rgb(255, 99, 132)", // red
		"rgb(255, 159, 64)", // orange
		"rgb(255, 205, 86)", // yellow
		"rgb(75, 192, 192)", // green
		"rgb(54, 162, 235)", // blue
		"rgb(153, 102, 255)", // purple
	];

	let datasets = {};
	for (let dataPoint of stats) {
		for (let arch of Object.keys(dataPoint.arches)) {
			if (!(arch in datasets)) {
				let color = chartColors.pop();
				datasets[arch] = {
					label: arch,
					backgroundColor: Chart.helpers.color(color).alpha(0.5).rgbString(),
					borderColor: color,
					data: []
				};
			}
			let downloads = 0;
			// Upstream logic: https://github.com/flathub/flathub-stats/blob/7711d11dd8224cd9a6655d3eaac97c9ae2ef46ea/update-stats.py#L23
			switch (downloadType) {
				case "installs+updates":
					downloads = dataPoint.arches[arch][0];
					break;
				case "installs":
					downloads = dataPoint.arches[arch][0] - dataPoint.arches[arch][1];
					break;
				case "updates":
					downloads = dataPoint.arches[arch][1];
					break;
			}

			let dataset = datasets[arch];
			dataset.data.push({
				x: new Date(dataPoint.date),
				y: downloads
			});
		}
	}
	chart.data.datasets = Object.values(datasets);
	chart.update();
	updateBasicStats();
}

function updateURL() {
	window.location.hash = `#ref=${ref}&interval=${interval}&downloadType=` + encodeURIComponent(downloadType);
}

async function refHandler(event) {
	let refEventValue = event.target.value;
	if (!refs.has(refEventValue)) {
		return;
	}
	ref = refEventValue;
	let response = await fetch(`./data/${ref.replace("/", "_")}.json`);
	let json = await response.json();

	stats = json.stats;
	updateDatasets();
	updateURL();
}

function intervalHandler() {
	interval = event.target.value;
	if (interval === "infinity") {
		delete chart.options.scales.xAxes[0].ticks.min;
		min = null;
	} else {
		min = new Date();
		min.setDate(min.getDate() - interval);
		chart.options.scales.xAxes[0].ticks.min = min;
	}
	chart.update();
	updateBasicStats();
	updateURL();
}

function downloadTypeHandler() {
	downloadType = event.target.value;
	updateDatasets();
	updateURL();
}

async function init() {
	initChart();

	let response = await fetch("./data/refs.json");
	let json = await response.json();
	json.forEach(ref => refs.add(ref));
	let refsElement = document.getElementById("refs");

	for (let ref of refs.keys()) {
		let option = document.createElement("option");
		option.value = ref;
		refsElement.append(option);
	}

	let refElement = document.getElementById("ref");
	let intervalSelectElement = document.getElementById("interval-select");
	let downloadTypeElement = document.getElementById("downloadType");
	let params = new URLSearchParams(window.location.hash.substring(1));

	refElement.value = params.has("ref") ? params.get("ref") : refsElement.childNodes[0].value;
	if (params.has("interval")) {
		intervalSelectElement.value = params.get("interval");
	}
	interval = intervalSelectElement.value;
	if (params.has("downloadType")) {
		downloadTypeElement.value = params.get("downloadType");
	}
	downloadType = downloadTypeElement.value;

	refElement.addEventListener("change", refHandler);
	intervalSelectElement.addEventListener("change", intervalHandler);
	downloadTypeElement.addEventListener("change", downloadTypeHandler);

	await refHandler({target: {value: refElement.value}});
	intervalSelectElement.dispatchEvent(new Event("change"));
	downloadTypeElement.dispatchEvent(new Event("change"));
}

window.addEventListener("DOMContentLoaded", init);
