let animationFrameId;

function startAnimation(
    numberOfPoints = 1500,
    maxLength = 300,
    lengthVariation = 20,
    maxRotationSpeed = 0.012,
    rotationSpeedVariation = 0.005,
    timeIncrement = 0.1,
    dotRadius = 1,
    fluctuationAmplitude = 20,
    backgroundColor = 'black',
    dotColor = 'rgb(255, 255, 255)',
    startAtZeroAngle = true
) {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let anglesTensor = startAtZeroAngle ? tf.zeros([numberOfPoints]) : tf.randomUniform([numberOfPoints], 0, 2 * Math.PI);
    let rotationSpeedsTensor = tf.abs(tf.randomNormal([numberOfPoints], maxRotationSpeed, rotationSpeedVariation));
    let lengthsTensor = tf.abs(tf.randomNormal([numberOfPoints], maxLength, lengthVariation));
    let fluctuationAmplitudes = Array.from({ length: numberOfPoints }, () => Math.random() * fluctuationAmplitude);
    let phaseOffsets = Array.from({ length: numberOfPoints }, () => Math.random() * 2 * Math.PI);

    function calculateCoordinates(angles, lengths, amplitudes, time, phases) {
        return tf.tidy(() => {
            const timeTensor = tf.scalar(time);
            const fluctuationTensor = tf.tensor1d(amplitudes).mul(timeTensor.add(tf.tensor1d(phases)).sin());
            const fluctuatingLengthsTensor = tf.tensor1d(lengths).add(fluctuationTensor);

            return {
                x: fluctuatingLengthsTensor.mul(tf.tensor1d(angles).cos()).dataSync(),
                y: fluctuatingLengthsTensor.mul(tf.tensor1d(angles).sin()).dataSync()
            };
        });
    }

    const maxEffectiveSpeed = maxRotationSpeed + rotationSpeedVariation;

    function calculateAlpha(speed) {
        if (speed >= maxEffectiveSpeed) return 1; // Максимальная непрозрачность
        return 0.01 + 0.99 * (speed / maxEffectiveSpeed); // Интерполяция между 10% и 100%
    }

    function getDotColor(speed) {
        const alpha = calculateAlpha(speed);
        return dotColor.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    }

    function drawPoints(coordinates, speeds) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        coordinates.x.forEach((x, i) => {
            ctx.beginPath();
            ctx.arc(canvas.width / 2 + x, canvas.height / 2 + coordinates.y[i], dotRadius, 0, 2 * Math.PI);
            ctx.fillStyle = getDotColor(speeds[i]);
            ctx.fill();
        });
    }

    let time = 0;
    function draw() {
        let angles = anglesTensor.dataSync();
        let lengths = lengthsTensor.dataSync();
        const currentSpeeds = rotationSpeedsTensor.dataSync(); // Получение текущих скоростей

        const coordinates = calculateCoordinates(angles, lengths, fluctuationAmplitudes, time, phaseOffsets);
        drawPoints(coordinates, currentSpeeds); // Передаем скорости в drawPoints

        const newAnglesTensor = anglesTensor.add(rotationSpeedsTensor);
        anglesTensor.dispose();
        anglesTensor = newAnglesTensor;
        time += timeIncrement;

        animationFrameId = requestAnimationFrame(draw);
    }


    draw();
}


// Запуск анимации при загрузке страницы
document.addEventListener("DOMContentLoaded", function() {
    startAnimation();
});



// Define the function that needs to be called on input change
function onInputChange() {
    function hexToRgb(hex) {
        // Ensure the string starts with #
        if (hex.charAt(0) === '#') {
            hex = hex.substring(1);
        }

        // Convert hex values to decimal
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Return the RGB format string
        return `rgb(${r}, ${g}, ${b})`;
    }

    const numberOfPoints = parseInt(document.getElementById("numberOfPoints").value);
    const maxLength = parseInt(document.getElementById("maxLength").value);
    const lengthVariation = parseInt(document.getElementById("lengthVariation").value);
    const maxRotationSpeed = parseFloat(document.getElementById("maxRotationSpeed").value);
    const rotationSpeedVariation = parseFloat(document.getElementById("rotationSpeedVariation").value);
    const timeIncrement = parseFloat(document.getElementById("fluctuationFrequency").value);
    const dotRadius = parseFloat(document.getElementById("dotRadius").value);
    const fluctuationAmplitude = parseFloat(document.getElementById("fluctuationAmplitude").value);
    const backgroundColor = document.getElementById("backgroundColor").value;
    const dotColor = hexToRgb(document.getElementById("dotColor").value);
    const startAtZeroAngle = document.getElementById("startAtZeroAngle").checked;

    // Call your animation start function here
    startAnimation(numberOfPoints, maxLength, lengthVariation, maxRotationSpeed, rotationSpeedVariation, timeIncrement, dotRadius, fluctuationAmplitude, backgroundColor, dotColor, startAtZeroAngle);
}

// Get all input elements within the settings panel
const inputs = document.querySelectorAll(".settings-panel input");

// Add the change event listener to each input
inputs.forEach(input => {
    input.addEventListener('change', onInputChange);
});

document.getElementById("hideButton").addEventListener("click", function() {
    if (document.getElementById("settingsPanel").style.display === 'none') {
        document.getElementById("settingsPanel").style.display = 'block';
    } else
    {
        document.getElementById("settingsPanel").style.display = 'none';
    }
});

