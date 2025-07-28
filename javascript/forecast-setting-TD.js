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
        localization: { format: 'h T' },
        useCurrent: false
    });

    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 5);

    const datePicker = new tempusDominus.TempusDominus(datePickerElement, {

        restrictions: { minDate: today, maxDate: maxDate },
        display: {
            components: { calendar: true, date: true, month: false, year: false, decades: false, clock: false }
        },
        localization: { format: 'ddd, MMM d' },
        useCurrent: false
    });


    datePickerElement.addEventListener('change.td', function (e) {
        // We use the information from the 'e' object.

        console.log("TODAY IS: ", today);
        console.log("THE MAX DATE IS: ", maxDate);

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

        const formattedDate2 = `${year}-${month}-${day}`;

        console.log("useful date: ", formattedDate2);


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

        console.log("HI");
        console.log(e);
        console.log(e.date);
        console.log(e.detail.isClear);
        console.log(e.isValid);


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