let jsonData; // Declare jsonData in the global scope
let vinegarChart; // Declare vinegarChart in the global scope
let grapeChart; // Declare grapeChart in the global scope

// Function to display the round information based on the selected ladder
function displayRoundInfo(selectedLadder, rankersData) {
    // Your code to display round information using the provided jsonData
    const roundData = jsonData.ladders[selectedLadder];
    const roundNumber = jsonData.number;
    const createdOn = new Date(roundData.createdOn).toLocaleString();
    const closedOn = new Date(roundData.closedOn).toLocaleString();
    const roundType = roundData.roundTypes ? roundData.roundTypes[0] : "";

    // Display round information in the table
    $("#roundType").text(roundType);
    $("#createdOn").text(createdOn);
    $("#closedOn").text(closedOn);

    // Display ladder information in the table
    const ladderInfoTable = $("#ladderInfoTable tbody");
    ladderInfoTable.empty();

    const ladderData = jsonData.ladders[selectedLadder];
    const ladderTypes = ladderData.ladderTypes.join(", ");

    // Create a new row for ladder information with concatenated ladder types
    const ladderRow = `
        <tr>
            <td><strong>Ladder Types:</strong> ${ladderTypes}</td>
            <td><strong>Base Points To Promote:</strong> ${ladderData.basePointsToPromote}</td>
            <td><strong>Created On:</strong> ${new Date(ladderData.createdOn).toLocaleString()}</td>
            <!-- You can add more information here as needed -->
        </tr>
    `;

    ladderInfoTable.append(ladderRow);

    // Load charts after displaying round information
    loadCharts(rankersData);
}

// Function to load charts for vinegar and grape counts
function loadCharts(rankersData) {
    // Prepare data for vinegar and grape counts
    const vinegarData = rankersData.map((ranker) => ranker.vinegar || 0);
    const grapeData = rankersData.map((ranker) => ranker.grapes || 0);
    const rankerNames = rankersData.map((ranker) => ranker.username || "");

    // Destroy existing charts if they exist
    if (vinegarChart) {
        vinegarChart.destroy();
    }
    if (grapeChart) {
        grapeChart.destroy();
    }

    // Get the last ladder number
    const ladderNumbers = Object.keys(jsonData.ladders);
    const lastLadderNumber = ladderNumbers[ladderNumbers.length - 1];

    // Create the vinegar count chart
    const vinegarCtx = document.getElementById("vinegarChart").getContext("2d");
    vinegarChart = new Chart(vinegarCtx, {
        type: "bar",
        data: {
            labels: rankerNames,
            datasets: [
                {
                    label: "Vinegar Count",
                    data: vinegarData,
                    backgroundColor: rankersData.map((ranker) =>
                        (ranker.ladderNumber === lastLadderNumber ||
                         ranker.growing === false)
                            ? "rgba(255, 99, 132, 0.6)" // Red color for "growing" false or last ladder rankers
                            : "rgba(54, 162, 235, 0.6)" // Blue color for other rankers
                    ),
                    borderWidth: 1,
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
            plugins: {
                legend: {
                    display: false, // Hide the legend
                },
            },
        },
    });

    // Create the grape count chart
    const grapeCtx = document.getElementById("grapeChart").getContext("2d");
    grapeChart = new Chart(grapeCtx, {
        type: "bar",
        data: {
            labels: rankerNames,
            datasets: [
                {
                    label: "Grape Count",
                    data: grapeData,
                    backgroundColor: rankersData.map((ranker) =>
                        (ranker.ladderNumber === lastLadderNumber ||
                         ranker.growing === false)
                            ? "rgba(255, 99, 132, 0.6)" // Red color for "growing" false or last ladder rankers
                            : "rgba(54, 162, 235, 0.6)" // Blue color for other rankers
                    ),
                    borderWidth: 1,
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
            plugins: {
                legend: {
                    display: false, // Hide the legend
                },
            },
        },
    });
}

// Function to handle loading data when the round or ladder is selected
function loadRoundData() {
    const selectedRound = $("#roundSelect").val();
    // Load JSON data for the selected round from the dropdown
    fetchJSONData(selectedRound);
}

// Function to fetch JSON data for the selected round
function fetchJSONData(roundNumber) {
    const jsonFile = `${roundNumber}.json`;
    const url = `rounddata/${jsonFile}`;

    $.ajax({
        url: url,
        dataType: "json",
        success: function (data) {
            jsonData = data; // Update the jsonData variable with the loaded data

            // Check if there are at least three ladders available
            if (jsonData.ladders && Object.keys(jsonData.ladders).length >= 3) {
                // Get the keys (ladder numbers) of all available ladders
                const ladderNumbers = Object.keys(jsonData.ladders);
                // Sort the ladder numbers in ascending order
                ladderNumbers.sort((a, b) => a - b);
                // Get the ladder number of the last ladder
                const lastLadderNumber = ladderNumbers[ladderNumbers.length - 1];
                // Get the ladder number of the ladder before the last ladder
                const ladderBeforeLastNumber = ladderNumbers[ladderNumbers.length - 2];
                // Get the ladder number of the ladder before the last ladder -2
                const ladderBeforeLastMinusTwoNumber = ladderNumbers[ladderNumbers.length - 3];

                // Get the rankers' data from the last ladder minus one
                const rankersDataLastLadderMinusOne = jsonData.ladders[ladderBeforeLastNumber].rankers;

                // Assign Grape and Vinegar values from the ladder before the last ladder -2 to the rankers
                for (const ranker of rankersDataLastLadderMinusOne) {
                    // Get the ranker's ID
                    const rankerId = ranker.accountId;
                    // Find the ranker's data in the ladder before the last ladder -2
                    const correspondingRanker = jsonData.ladders[ladderBeforeLastMinusTwoNumber].rankers.find(
                        (r) => r.accountId === rankerId
                    );

                    // Assign the Grape and Vinegar values from the ladder before the last ladder -2
                    if (correspondingRanker) {
                        ranker.grapes = correspondingRanker.grapes;
                        ranker.vinegar = correspondingRanker.vinegar;
                    } else {
                        // If the ranker does not exist in the ladder before the last ladder -2, assign 0 values
                        ranker.grapes = 0;
                        ranker.vinegar = 0;
                    }
                }

                // Sort rankersData based on vinegar count in descending order
                rankersDataLastLadderMinusOne.sort((a, b) => b.vinegar - a.vinegar);

                // Display round information and load charts for the last ladder minus one
                displayRoundInfo(lastLadderNumber, rankersDataLastLadderMinusOne);
            } else {
                console.error("JSON data does not have enough ladders to proceed.");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error loading JSON data:", error);
        },
    });
}

// Function to fetch round files and populate the dropdown on page load
function fetchRoundFiles() {
    $.ajax({
        url: "fileList.json",
        dataType: "json",
        success: function (data) {
            populateRoundDropdown(data);

            // Add event listener to round select dropdown
            $("#roundSelect").on("change", function () {
                loadRoundData();
            });
        },
        error: function (xhr, status, error) {
            console.error("Error fetching round files:", error);
        },
    });
}

// Function to populate the round number dropdown
function populateRoundDropdown(fileNames) {
    const roundSelect = $("#roundSelect");
    roundSelect.empty();

    // Add the fetched round files to the dropdown
    fileNames.forEach((fileName) => {
        const roundNumber = fileName.replace(/\.json$/, ""); // Remove ".json" extension
        roundSelect.append(`<option value="${roundNumber}">${roundNumber}</option>`);
    });

    // Load data for the initial round selection
    loadRoundData();
}

// Fetch round files and populate the dropdown on page load
fetchRoundFiles();
