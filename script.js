let chart;
let refs = new Set();
let stats;
let downloadType = "installs+updates";
let min;

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
	let n = 0;
	let average = 0;
	chart.data.datasets.forEach((dataset) => {
		dataset.data.forEach((dataPoint) => {
			if (!min || min <= dataPoint.x) {
				total += dataPoint.y;
				n++;
			}
		})
	});
	average = total / n;
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

async function refHandler(event) {
	let ref = event.target.value;
	if (!refs.has(ref)) {
		return;
	}
	let response = await fetch(`./data/${ref.replace("/", "_")}.json`);
	let json = await response.json();

	stats = json.stats;
	updateDatasets();
}

function intervalHandler() {
	let interval = event.target.value;
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
}

function downloadTypeHandler() {
	downloadType = event.target.value;
	updateDatasets();
}

async function init() {
	initChart();

	let response = await fetch("./data/refs.json");
	let json = await response.json();
	json.forEach(ref => refs.add(ref));
	let refsElement = document.getElementById("refs");
	let refElement = document.getElementById("ref");

	for (let ref of refs.keys()) {
		let option = document.createElement("option");
		option.value = ref;
		refsElement.append(option);
	}
	refElement.value = refsElement.childNodes[0].value;

	refElement.addEventListener("change", refHandler);
	refElement.dispatchEvent(new Event("change"));

	let intervalSelectElement = document.getElementById("interval-select");
	intervalSelectElement.addEventListener("change", intervalHandler);

	let downloadTypeElement = document.getElementById("downloadType");
	downloadTypeElement.addEventListener("change", downloadTypeHandler);
}

window.addEventListener("DOMContentLoaded", init);
