last30 = data.slice(-30).reverse();
var timeData = [];
var timeStamps = [];
last30.forEach(e => {
  timeData.push(e.runtime)
  timeStamps.push(e.timestamp)
})

dateLabels = [];
var today = new Date();
for (var i = 0; i < 14; i++) {
  var date = new Date();
  date.setDate(today.getDate() - i);
  dateLabels.push(date.toLocaleDateString("en-US", {timeZone: "America/Denver"}));
}

var passDataSet = [0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var failDataSet = [0,0,0,0,0,0,0,0,0,0,0,0,0,0];

var bucketDate = new Date();
bucketDate.setDate(today.getDate());
var resultsArrayIndex = 0;
data.forEach(e => {
  var resultDate = new Date(e.timestamp);

  resultsArrayIndex = assignToBucket(resultDate, bucketDate, e.passed, resultsArrayIndex, passDataSet, failDataSet);
})

dateLabels.reverse();
failDataSet.reverse();
passDataSet.reverse();

var timeChartElement = document.getElementById("timeChartElement").getContext('2d');
var timeChart = new Chart(timeChartElement, {
    type: 'line',
    data: {
      labels: timeData,
      datasets: [{
        borderColor: "#3E95CD",
        fill: false,
        data: timeData
      }]
    },
    options: {
      tooltips: {
        custom: function(tooltip) {
          if (!tooltip) return
            tooltip.displayColors = false;
        },
        callbacks: {
          label: function(tooltipItem, data) {
            timestamp = new Date(timeStamps[tooltipItem.index]);
            return timestamp.toLocaleString('en-US', {timeZone: "America/Denver"})
          },
          title: function(tooltipItem, data) {
            return "Runtime: " + tooltipItem[0].yLabel + " seconds";
          }
        }
      },
      legend: {
        display: false
      },
      title: {
        display: true,
        fontSize: 18,
        text: timeChartTitle
      },
      scales: {
        xAxes: [{
          ticks: {
            display: false
          }
        }],
        yAxes: [{
          ticks: {
            suggestedMin: 0
          }
        }]
      }
    }
});

var resultChartElement = document.getElementById("resultChartElement");
var resultsChart = new Chart(resultChartElement, {
  type: 'bar',
  data: {
    labels: dateLabels,
    datasets: [
    {
      label: "Pass",
      data: passDataSet,
      backgroundColor: '#D6E9C6'
    },
    {
      label: "Fail",
      data: failDataSet,
      backgroundColor: "#EBCCD1"
    }
    ]
  },
  options: {
    title: {
      display: true,
      fontSize: 18,
      text: resultsChartTitle
    },
    scales: {
      xAxes: [{ stacked: true }],
      yAxes: [{
        stacked: true,
        ticks: {
          min: 0,
          stepSize: 1,
          autoSkip: false
        }
      }]
    }
  }
});

function areSameDate(d1, d2) {
  return d1.toLocaleDateString("en-US", {timeZone: "America/Denver"}) == d2.toLocaleDateString("en-US", {timeZone: "America/Denver"});
}

function assignToBucket(date, bucketDate, result, bucketIndex, passBucket, failBucket) {
  if (bucketIndex >= 14)
    return bucketIndex

  if (areSameDate(date, bucketDate)) {
    if (result) {
      passBucket[bucketIndex]++;
    } else {
      failDataSet[bucketIndex]++;
    }
  } else {
    bucketIndex++;
    bucketDate.setDate(bucketDate.getDate() - 1);
    assignToBucket(date, bucketDate, result, bucketIndex, passBucket, failBucket);
  }

  return bucketIndex;
}