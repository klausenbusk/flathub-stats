let chart;

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
			}
		}
	});
}

async function refHandler(event) {
	let ref = event.target.value;
	let response = await fetch(`./data/${ref.replace("/", "_")}.json`);
	let json = await response.json();


	let chartColors = [
		"rgb(255, 99, 132)", // red
		"rgb(255, 159, 64)", // orange
		"rgb(255, 205, 86)", // yellow
		"rgb(75, 192, 192)", // green
		"rgb(54, 162, 235)", // blue
		"rgb(153, 102, 255)", // purple
	];

	let datasets = {};
	for (let dataPoint of json.stats) {
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
			let dataset = datasets[arch];
			// TODO: Delta downloads
			// https://github.com/flathub/flathub/issues/177#issuecomment-650122279
			dataset.data.push({
				x: new Date(dataPoint.date),
				y: dataPoint.arches[arch][0]
			});
		}
	}
	chart.data.datasets = Object.values(datasets);
	chart.update();
}

function intervalHandler() {
	let interval = event.target.value;
	if (interval === "infinity") {
		delete chart.options.scales.xAxes[0].ticks.min;
	} else {
		let d = new Date();
		d.setDate(d.getDate() - interval);
		chart.options.scales.xAxes[0].ticks.min = d;
	}
	chart.update();
}

async function init() {
	initChart();

	let response = await fetch("./data/refs.json");
	let json = await response.json()
	let refSelectElement = document.getElementById("ref-select");

	for (let ref of json) {
		let option = document.createElement("option");
		option.text = ref;
		refSelectElement.add(option);
	}

	refSelectElement.addEventListener("change", refHandler);
	refSelectElement.dispatchEvent(new Event("change"));


	let intervalSelectElement = document.getElementById("interval-select");
	intervalSelectElement.addEventListener("change", intervalHandler);
}

window.addEventListener("DOMContentLoaded", init);
