$(document).ready(function () {
    // Ensure SharePoint scripts are loaded before calling the 'onLoad' function
  

        // Constants and variables
        const parsedDataArray2 = [];
        var ChartSection = document.getElementById("ChartSection");
        var Clear = document.getElementById("Clear");
        var Mapbutton = document.getElementById("buttonMap");
        var dropdown = document.getElementById("dropdownlistSuburb");
        var departmentdropdown = document.getElementById("dropdownlist2");
        var codegroupdropdown = document.getElementById("dropdownlistCode");
		var recordcodesChart;

        // Leaflet map initialization
        
        var map = L.map('map').setView([-33.918861, 18.423300], 17);
        const markerLayerGroup = L.layerGroup().addTo(map);
        var markers = L.markerClusterGroup();
        var MapContainer = document.getElementById("map");
        var chartcontainer = document.getElementById("ChartContainer");
		var activeButton = null;
        let mapInitialized = true;
        let coordinatesArray = null;
        chartcontainer.style.display = "block";
        DropdownContainer.style.display = "none";
        DropdownContainer
        ChartSection.classList.add("active");
        
        // Load on Function Getting data from the csv file and loading it into an array to feed the chart 
        ToCsv();

		
        // Event listeners
        // Chart Button
        ChartSection.addEventListener("click", async function (event) {
            event.preventDefault();
            ChartSection.classList.add("active");
			Mapbutton.classList.remove("active");
			DropdownContainer.style.display = "none";
            chartcontainer.style.display = "block";
            MapContainer.style.display = "none";
            coordinatesArray = await ToCsv();
            
            
        });
        // Map Button
         Mapbutton.addEventListener("click", async function (event) {
            event.preventDefault();
            ChartSection.classList.remove("active");
			Mapbutton.classList.add("active");
			DropdownContainer.style.display = "block";
            LoadMap();
            map.invalidateSize();
            LoadMap();
        });

		// SR Code Dropdown
        codegroupdropdown.addEventListener("change", async function (event) {
            event.preventDefault();
            clearMarkers();
            updateMarkers("Code");
        });
		// Suburb Dropdown
        dropdown.addEventListener("change", async function (event) {
            event.preventDefault();
            clearMarkers();
            updateMarkers("Suburb");
        });


        // Functions
        //Clears makers off the map 
        function clearMarkers() {
            markerLayerGroup.clearLayers();
        }
		//Creates makers for surburb/code map 
        async function updateMarkers(onChange) {
            // Get selected values from dropdowns
            const selectedSuburb = dropdown.value;
            const selectedCode = codegroupdropdown.value;

            // Call the ToCsv function to get an array of data
            const array = await ToCsv();
            console.log('Coordinates Array:', array);

            // Create a MarkerClusterGroup
            const markers = L.markerClusterGroup();

            if (onChange === "Suburb") {
                const uniqueSuburb = [...new Set(array.map(entry => entry.official_suburb))];
                const filteredArray = array.filter(entry => entry.official_suburb === selectedSuburb);

                const filteredArrayCodeGroup = [...new Set(filteredArray.map(entry => entry.code_group))];
                console.log('Filtered Array:', filteredArrayCodeGroup);

                populateDropdown(filteredArrayCodeGroup, "3");

                array.forEach(function (entry) {
                    if (entry.latitude && entry.longitude && entry.official_suburb === selectedSuburb) {
                        const marker = L.circleMarker([entry.latitude, entry.longitude], {
                            color: 'blue',
                            fillColor: 'blue',
                            fillOpacity: 1,
                            radius: 5
                        }).bindPopup(entry.code_group);

                        markers.addLayer(marker);
                    }
                });
            }

            if (onChange === "Code") {
                array.forEach(function (entry) {
                    if (entry.latitude && entry.longitude && entry.official_suburb === selectedSuburb && entry.code_group === selectedCode) {
                        const marker = L.circleMarker([entry.latitude, entry.longitude], {
                            color: 'blue',
                            fillColor: 'blue',
                            fillOpacity: 1,
                            radius: 5
                        }).bindPopup(entry.code_group);

                        markers.addLayer(marker);
                    }
                });
            }

            markerLayerGroup.addLayer(markers);
        }

        function LoadMap() {
            MapContainer.style.display = "block";
            chartcontainer.style.display = "none";

            ToCsv().then(array => {
                const uniqueSuburb = [...new Set(array.map(entry => entry.official_suburb))];
                populateDropdown(uniqueSuburb, "1");
            });

         	map.fitBounds([
    			[-34.0978, 18.4217], // Southwest coordinates (adjust as needed)
    			[-33.7978, 18.9217]  // Northeast coordinates (adjust as needed)
			]);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            map.setMinZoom(7);

            var mountainIcon = L.icon({
                iconUrl: 'images/table-mountain.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
            });

            var landmarks = [
                { name: 'Table Mountain', coordinates: [-33.9625, 18.4034], icon: mountainIcon }
            ];

            landmarks.forEach(function (landmark) {
                L.marker(landmark.coordinates, { icon: landmark.icon })
                    .addTo(map)
                    .bindPopup(landmark.name)
                    .openPopup();
            });
        }

    
        function ToCsv() {
            if (coordinatesArray !== null) {
                return Promise.resolve(coordinatesArray);
            }

           const csvUrl = 'extracts/sr_hex_filteredTopTen_file.csv';

            console.log("Before fetch");

            return fetch(csvUrl)
                .then(response => response.text())
                .then(data => {
                    console.log("After fetch");

                    return Papa.parse(data, {
                        header: true,
                        dynamicTyping: true,
                        skipEmptyLines: true
                    });
                })
                .then(parsedData => {
                    coordinatesArray = parsedData.data;
                    console.log('Parsed CSV data:', coordinatesArray);
                    ProcessChart(coordinatesArray);
                    return coordinatesArray;
                })
                .catch(error => {
                    console.error('Error fetching or parsing CSV:', error);
                });
        }

 function populateDropdown(Array, type) {
    const defaultOption = document.createElement('option');
    const dropdown = type === '1' ? document.getElementById("dropdownlistSuburb") : document.getElementById("dropdownlistCode");

    defaultOption.value = '..Select ' + (type === '1' ? 'Suburb' : 'Code');
    defaultOption.text = '..Select ' + (type === '1' ? 'Suburb' : 'Code');

    dropdown.innerHTML = '';
    dropdown.add(defaultOption);

    Array.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.text = item;
        dropdown.add(option);
    });
}

function ProcessChart(array) {
    const recordsPerSuburb = {};
    const recordsPerSuburbCodeGroup = {};

    array.forEach(item => {
        if (item.official_suburb) {
            const suburb = item.official_suburb;
            recordsPerSuburb[suburb] = (recordsPerSuburb[suburb] || 0) + 1;
        }

        if (item.official_suburb && item.code_group) {
            const suburbCodeGroup = item.official_suburb;
            recordsPerSuburbCodeGroup[suburbCodeGroup] = recordsPerSuburbCodeGroup[suburbCodeGroup] || {};
            recordsPerSuburbCodeGroup[suburbCodeGroup][item.code_group] = (recordsPerSuburbCodeGroup[suburbCodeGroup][item.code_group] || 0) + 1;
        }
    });

    const recordsPerSuburbArray = Object.entries(recordsPerSuburb).map(([suburb, count]) => ({ suburb, count }));
    const recordsPerSuburbCodeGroupArray = Object.keys(recordsPerSuburbCodeGroup).map(suburbCodeGroup => ({
        [suburbCodeGroup]: recordsPerSuburbCodeGroup[suburbCodeGroup],
    }));

    recordsPerSuburbArray.sort((a, b) => b.count - a.count);
    const topTenSuburbs = recordsPerSuburbArray.slice(0, 10);

    console.log('Top Ten Suburbs:', topTenSuburbs);
    console.log('All Suburbs:', recordsPerSuburbArray);
    console.log('All Code:', recordsPerSuburbCodeGroupArray);

    const labels = topTenSuburbs.map(item => item.suburb);
    const counts = topTenSuburbs.map(item => item.count);

    const ctx2 = document.getElementById('recordsChart').getContext('2d');
    let chart;
    var fixedColors = [
    'rgba(170, 0, 0, 0.5)',
    'rgba(210, 18, 46, 0.5)',
    'rgba(226, 61, 40, 0.5)',
    'rgba(255, 8, 0, 0.5)',
    'rgba(255, 69, 0, 0.5)',
    'rgba(253, 92, 99, 0.5)',
    'rgba(254, 190, 16, 0.5)',
    'rgba(255, 199, 44, 0.5)',
    'rgba(240, 230, 140, 0.5)',
    'rgba(255, 255, 0, 0.5)'
    ];


    chart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: fixedColors,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: "SR Overview (Click bars to see code breakdown)",
                    font: {
                        size: 25,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: false,
                },
                datalabels: {
                    color: 'white',
                    anchor: 'center',
                    align: 'center',
                    font: {
                        size: 10,
                        weight: 'bold'
                    },
                    formatter: function (value, context) {
                        return value;
                    }
                }
            },
            indexAxis: 'y',
            scales: {
                x: {
                    display: true,
                    beginAtZero: true
                },
                y: {
                    beginAtZero: true
                }
            },
            events: ['click'],
            onClick: (evt, elements) => {
                if (elements.length > 0) {
                    const clickedIndex = elements[0].index;
                    const label = chart.data.labels[clickedIndex];
                    const value = chart.data.datasets[0].data[clickedIndex];

                    let matchingEntry;
                    for (let i = 0; i < recordsPerSuburbCodeGroupArray.length; i++) {
                        const entry = recordsPerSuburbCodeGroupArray[i];
                        if (entry.hasOwnProperty(label)) {
                            matchingEntry = entry;
                            break;
                        }
                    }

                    if (matchingEntry) {
                        const suburbCodeGroup = Object.keys(matchingEntry)[0];
                        const codeGroups = matchingEntry[suburbCodeGroup];
                        console.log('Clicked Bar Index:', clickedIndex);
                        console.log('Clicked Bar Label:', label);
                        console.log('Clicked Bar Value:', value);
                        console.log('Matching Entry:', matchingEntry);
                        console.log('Suburb Code Group:', suburbCodeGroup);
                        console.log('Code Groups:', codeGroups);
                        disposeChart();
                        CreateCodesChart(codeGroups);
                    } else {
                        console.log('No matching entry found for label:', label);
                    }
                }
            },
        }
    });
}

function CreateCodesChart(CodesArray) {
    const ctx2 = document.getElementById('recordcodesChart').getContext('2d');

    // Sort the data in descending order
    const sortedData = Object.entries(CodesArray).sort((a, b) => b[1] - a[1]);

    // Extract sorted labels and values
    const sortedLabels = sortedData.map(entry => entry[0]);
    const sortedValues = sortedData.map(entry => entry[1]);

    recordcodesChart = new Chart(ctx2, {
        type: 'pie',
        data: {
            labels: sortedLabels,
            datasets: [{
                label: 'Code Groups',
                data: sortedValues,
                backgroundColor: sortedValues.map((value, index) => getColorByPosition(index + 1)),
                borderColor: sortedValues.map((value, index) => getColorByPosition(index + 1)),
                borderWidth: 0,
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 10,
                            weight: 'bold'
                        }
                    }
                },
                datalabels: {
                    color: 'white',
                    anchor: 'center',
                    align: 'center',
                    font: {
                        size: 10,
                        weight: 'bold'
                    },
                    formatter: function (value, context) {
                        return value;
                    }
                }
            }
        }
    });
}

// Function to get color based on position
function getColorByPosition(position) {
    const colors = [
        'rgba(255, 0, 0, 0.7)',
        'rgba(255, 165, 0, 0.7)',
        'rgba(255, 255, 0, 0.7)',
        'rgba(0, 128, 0, 0.7)',
        'rgba(0, 0, 255, 0.7)',
        'rgba(128, 0, 128, 0.7)',
        'rgba(255, 20, 147, 0.7)',
        'rgba(0, 206, 209, 0.7)',
        'rgba(255, 215, 0, 0.7)',
        'rgba(220, 220, 220, 0.7)'
    ];
    return colors[position - 1] || 'rgba(135, 206, 235, 0.7)'; // Default color if position exceeds the available colors
}

//deletes chart so the data is able to be refreshed 
function disposeChart() {
 if (recordcodesChart && typeof recordcodesChart.destroy === 'function') {
	 recordcodesChart.destroy();
         recordcodesChart = null;
 }
}
 
});
