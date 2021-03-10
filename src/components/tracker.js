import Duration from "duration";

export default class Tracker {
  constructor() {
    this.interval = null;
  }

  trackTime(startDate, callback, formatted = true) {
    this.stop();
    this.interval = setInterval(() => {
      const now = new Date();
      const duration = new Duration(new Date(startDate), now);
      callback(
        formatted ? duration.toString("%H:%M:%S") : duration.milliseconds
      );
    }, 1000);
  }

  static daysPassed(date) {
    const duration = new Duration(new Date(date), new Date());
    return duration.toString("%d");
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
