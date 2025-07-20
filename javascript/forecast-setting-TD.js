// Wait for the entire page to be ready.
document.addEventListener('DOMContentLoaded', function () {

    // --- STEP 1: Get the HTML elements ---
    const datePickerElement = document.getElementById('date-picker-container');
    const timePickerElement = document.getElementById('hour-picker');

    // --- STEP 2: Initialize the Tempus Dominus pickers ---
    // We store the instances in these variables for easy access later.
    const timePicker = new tempusDominus.TempusDominus(timePickerElement, {
        display: {
            viewMode: 'clock',
            components: { hours: true, minutes: false, seconds: false, calendar: false }
        },
        localization: { format: 'h:00 T' },
        useCurrent: false
    });

    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 5);

    const datePicker = new tempusDominus.TempusDominus(datePickerElement, {
        useCurrent: true,
        restrictions: { minDate: today, maxDate: maxDate },
        display: {
            components: { calendar: true, date: true, month: false, year: false, decades: false, clock: false }
        },
        localization: { format: 'ddd, MMM d' }
    });

    //   // --- STEP 3: The Robust Update Function ---
    // function updateCombinedDateTime() {
    //     console.log("--- Update Function Called ---");

    //     // Get the current values directly from the picker instances.
    //     const datePart = datePicker.dates.get(0);
    //     const timePart = timePicker.dates.get(0);

    //     console.log("Current Date Part:", datePart);
    //     console.log("Current Time Part:", timePart);

    //     if (datePart && timePart) {
    //         const combinedDateTime = new Date(
    //             datePart.getFullYear(), datePart.getMonth(), datePart.getDate(),
    //             timePart.getHours(), timePart.getMinutes()
    //         );
    //         const isoString = combinedDateTime.toISOString();
    //         console.log("SUCCESS! Combined value is:", isoString);
    //     } else {
    //         console.log("Could not combine. One or both values are missing.");
    //     }
    // }

    // // --- STEP 4: Attach Event Listeners ---
    // // These listeners just trigger the update. The update function itself
    // // is responsible for getting the current state.
    // datePickerElement.addEventListener('change.td', updateCombinedDateTime);
    // timePickerElement.addEventListener('change.td', updateCombinedDateTime);

    // // --- STEP 5: Set Initial State ---
    // // Set a default time. This will trigger the 'change.td' event on the time picker,
    // // which in turn calls our update function for the first time.
    // timePicker.dates.setFromInput(new Date(2000, 0, 1, 9));

    // // We also call it once manually to capture the initial state of the date picker.
    // updateCombinedDateTime();;


    datePickerElement.addEventListener('change.td', function (e) {
        // We use the information from the 'e' object.

        console.log("HI");
        console.log(e.date);
        console.log(e.isClear);
        console.log(e.isValid);
        console.log(e);
        console.log("Date:", e.detail.date);
        // Check if the input was cleared

        const oldDateObject = e.detail.oldDate;

        // 2. Format it into the string "Mon Day Year"
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const month = monthNames[oldDateObject.getMonth()]; // .getMonth() is 0-indexed (Jan=0)
        const day = oldDateObject.getDate();
        const year = oldDateObject.getFullYear();

        const formattedDate = `${month} ${day} ${year}`;

        // 3. Log the final, formatted result
        console.log(formattedDate);

        if (e.isClear) {
            console.log("The date was cleared. The old date was:", e.oldDate);
            return; // Stop here
        }

        // Check if the new date is valid (good practice)
        if (e.isValid) {
            // Since it's not cleared and it's valid, we can safely use e.date
            console.log("New date selected:", e.date);

            // Now you can call your updateCombinedDateTime() function or do other work.
        }
    });


    timePickerElement.addEventListener('change.td', function (e) {
        // Correctly access the detail object
        const detail = e.detail;

        // Check if the input was cleared
        if (detail.isClear) {
            console.log("The time was cleared. The old value was:", detail.oldDate);
            return; // Stop here
        }

        // Check if the new date is valid
        if (detail.isValid) {
            // 1. Get the full Date object
            const fullDateObject = detail.date;
            console.log("Full Date object from picker:", fullDateObject);

            // 2. Extract the hours and minutes
            const hours = fullDateObject.getHours(); // Returns 0-23
            const minutes = fullDateObject.getMinutes(); // Returns 0-59

            // 3. Format them into a string (e.g., "14:05")
            // We use padStart to add a leading '0' if the number is less than 10
            const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

            console.log("Extracted Time Only:", formattedTime);

            // Now you can use the 'formattedTime' variable for whatever you need.
        } else {
            console.log("An invalid time was entered.");
        }
    });
});