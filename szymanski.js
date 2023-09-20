// Szymanskis Algorithm
// Define a global object to track states and queues for different functions
var functionStates = {}; // Stores current state for each function
var doorInQueues = {}; // Stores the door_in queue for each function
var waitingRoomQueues = {}; // Stores the waiting room queue for each function

// Function to initialize state and queues for a specific function
function initializeSzymanskiFunction(functionName) {
	assert(typeof(functionName) == "string", "functionName is not string");

	functionStates[functionName] = 0; // Initial state: noncritical section
	doorInQueues[functionName] = [];
	waitingRoomQueues[functionName] = [];
}

async function tryEnterDoorIn(functionName, processUUID) {
	assert(typeof(functionName) == "string", "functionName is not string");
	assert(typeof(processUUID) == "string", "processUUID is not string");

	// Check if no one is currently in the door_in or in the critical section
	if (functionStates[functionName] === 0) {
		functionStates[functionName] = 4; // Enter the critical section directly
	} else {
		doorInQueues[functionName].push(processUUID);
		while (functionStates[functionName] !== 0 && doorInQueues[functionName][0] !== processUUID) {
			if(doorInQueues[functionName].length == 0) {
				return;
			}
			console.error(`while (${functionStates[functionName]} !== 0 && ${doorInQueues[functionName][0]} !== ${processUUID}) {`);
			//log(`tryEnterDoorIn(${functionName}, ${processUUID})`);
			// Wait until it's your turn to enter the door_in
			await new Promise(resolve => setTimeout(resolve, 10));
		}
	}
}

async function waitForDoorIn(functionName, processUUID) {
	assert(typeof(functionName) == "string", "functionName is not string");
	assert(typeof(processUUID) == "string", "processUUID is not string");

	// Wait for other processes to get through door_in
	if(doorInQueues[functionName].length == 0) {
		return;
	}

	while (doorInQueues[functionName][0] !== processUUID) {
		if(doorInQueues[functionName].length == 0) {
			return;
		}
		//log(`waitForDoorIn(${functionName}, ${processUUID})`);
		await new Promise(resolve => setTimeout(resolve, 10));
	}
}

async function signalDoorOut(functionName, processUUID) {
	assert(typeof(functionName) == "string", "functionName is not string");
	assert(typeof(processUUID) == "string", "processUUID is not string");

	// Signal that you've crossed door_out
	const index = doorInQueues[functionName].indexOf(processUUID);
	if (doorInQueues[functionName].length > 0) {
		console.error(`signalDoorOut(${functionName}, ${processUUID}) -> index: ${index}`);
		console.error("doorInQueues length before doorOut: " + doorInQueues[functionName].length);
		doorInQueues[functionName].splice(index, 1); // Remove yourself from the waiting room
		console.error("doorInQueues length after doorOut: " + doorInQueues[functionName].length);
	}
}

function exitWaitingRoom(functionName, processUUID) {
	assert(typeof(functionName) == "string", "functionName is not string");
	assert(typeof(processUUID) == "string", "processUUID is not string");


	// Exit the waiting room
	const index = waitingRoomQueues[functionName].indexOf(processUUID);
	if (index !== -1) {
		//log(`exitWaitingRoom(${functionName}, ${processUUID})`);
		waitingRoomQueues[functionName].splice(index, 1); // Remove yourself from the waiting room
	}
}

async function exitCriticalSection (functionName, processUUID) {
	assert(typeof(functionName) == "string", "functionName is not string");
	assert(typeof(processUUID) == "string", "processUUID is not string");

	console.error(`exitCriticalSection(${functionName}, ${processUUID})`);
	// Exit the critical section
	functionStates[functionName] = 0;

	// Signal that you've crossed door_out (if needed)
	await signalDoorOut(functionName, processUUID);

	// Exit the waiting room
	exitWaitingRoom(functionName, processUUID);
	console.error(`DONE exitCriticalSection(${functionName}, ${processUUID})`);
}

async function waitForAccessToCriticalSection (functionName, processUUID) {
	assert(typeof(functionName) == "string", "functionName is not string");
	assert(typeof(processUUID) == "string", "processUUID is not string");

	// Declare intention to enter the critical section
	functionStates[functionName] = 1;

	// Attempt to enter the door_in
	await tryEnterDoorIn(functionName, processUUID);

	// Enter the waiting room (State 3)
	functionStates[functionName] = 3;
	waitingRoomQueues[functionName].push(processUUID);

	// Wait for other processes to get through door_in
	await waitForDoorIn(functionName, processUUID);

	// Enter the critical section (State 4)
	functionStates[functionName] = 4;
}
