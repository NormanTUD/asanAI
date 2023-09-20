// Szymanskis Algorithm
var functionStates = {}; // Stores current state for each function
var doorInQueues = {}; // Stores the door_in queue for each function
var waitingRoomQueues = {}; // Stores the waiting room queue for each function

// Function to initialize state and queues for a specific function
function initializeSzymanskiFunction(functionName) {
	assert(typeof functionName === "string", "functionName should be a string");

	functionStates[functionName] = 0; // Initial state: noncritical section
	doorInQueues[functionName] = [];
	waitingRoomQueues[functionName] = [];
}

async function attemptEnterCriticalSection(functionName, processUUID) {
    assert(typeof functionName === "string", "functionName should be a string");
    assert(typeof processUUID === "string", "processUUID should be a string");

    // Check if no one is currently in the door_in or in the critical section
    if (functionStates[functionName] === 0) {
        // Use a try-catch block to ensure atomic state transition
        try {
            functionStates[functionName] = 4; // Enter the critical section directly
        } catch (e) {
            // Handle any exceptions here if necessary
        }
    } else {
        // Use a try-catch block to ensure atomic queue operation
        try {
            doorInQueues[functionName].push(processUUID);
        } catch (e) {
            // Handle any exceptions here if necessary
        }
        try {
            while (functionStates[functionName] !== 0 && doorInQueues[functionName][0] !== processUUID) {
                if (doorInQueues[functionName].length === 0) {
                    return;
                }
                console.error(`while (${functionStates[functionName]} !== 0 && ${doorInQueues[functionName][0]} !== ${processUUID}) {`);
                //log(`attemptEnterCriticalSection(${functionName}, ${processUUID})`);
                // Wait until it's your turn to enter the door_in
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        } catch (e) {
            // Handle any exceptions here if necessary
        }
    }
}

async function waitForDoorInAccess(functionName, processUUID) {
	assert(typeof functionName === "string", "functionName should be a string");
	assert(typeof processUUID === "string", "processUUID should be a string");

	// Wait for other processes to get through door_in
	if (doorInQueues[functionName].length === 0) {
		return;
	}

	while (doorInQueues[functionName][0] !== processUUID) {
		if (doorInQueues[functionName].length === 0) {
			return;
		}
		//log(`waitForDoorInAccess(${functionName}, ${processUUID})`);
		await new Promise(resolve => setTimeout(resolve, 10));
	}
}

async function signalExitCriticalSection(functionName, processUUID) {
	assert(typeof functionName === "string", "functionName should be a string");
	assert(typeof processUUID === "string", "processUUID should be a string");

	try {
		// Signal that you've crossed door_out
		const index = doorInQueues[functionName].indexOf(processUUID);
		if (index !== -1) {
			console.error(`signalExitCriticalSection(${functionName}, ${processUUID}) -> index: ${index}`);
			console.error("doorInQueues length before exitCriticalSection: " + doorInQueues[functionName].length);

			// Exit the critical section
			functionStates[functionName] = 0;

			doorInQueues[functionName].splice(index, 1); // Remove yourself from the waiting room

			console.error("doorInQueues length after exitCriticalSection: " + doorInQueues[functionName].length);
		}
	} catch (e) {
		console.error(`Error in signalExitCriticalSection(${functionName}, ${processUUID}): ${e.message}`);
	}
}

function leaveWaitingRoom(functionName, processUUID) {
	assert(typeof functionName === "string", "functionName should be a string");
	assert(typeof processUUID === "string", "processUUID should be a string");

	// Exit the waiting room
	const index = waitingRoomQueues[functionName].indexOf(processUUID);
	if (index !== -1) {
		//log(`leaveWaitingRoom(${functionName}, ${processUUID})`);
		waitingRoomQueues[functionName].splice(index, 1); // Remove yourself from the waiting room
	}
}

async function exitCriticalSectionAndWaitingRoom(functionName, processUUID) {
	assert(typeof functionName === "string", "functionName should be a string");
	assert(typeof processUUID === "string", "processUUID should be a string");

	console.error(`exitCriticalSectionAndWaitingRoom(${functionName}, ${processUUID})`);

	// Signal that you've crossed door_out (if needed)
	await signalExitCriticalSection(functionName, processUUID);

	// Exit the critical section
	functionStates[functionName] = 0;

	// Exit the waiting room
	leaveWaitingRoom(functionName, processUUID);

	console.error(`DONE exitCriticalSectionAndWaitingRoom(${functionName}, ${processUUID})`);
}

async function requestCriticalSectionAccess(functionName, processUUID) {
	assert(typeof functionName === "string", "functionName should be a string");
	assert(typeof processUUID === "string", "processUUID should be a string");

	// Declare intention to enter the critical section
	functionStates[functionName] = 1;

	// Attempt to enter the door_in
	await attemptEnterCriticalSection(functionName, processUUID);

	// Enter the waiting room (State 3)
	functionStates[functionName] = 3;
	waitingRoomQueues[functionName].push(processUUID);

	// Wait for other processes to get through door_in
	await waitForDoorInAccess(functionName, processUUID);

	// Enter the critical section (State 4)
	functionStates[functionName] = 4;
}

