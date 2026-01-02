class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTime = performance.now();
  }
  
  startMeasure(name) {
    this.metrics.set(name, {
      start: performance.now(),
      end: null,
      duration: null
    });
  }
  
  endMeasure(name) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.end = performance.now();
      metric.duration = metric.end - metric.start;
      
      // Log if duration is concerning
      if (metric.duration > 1000) {
        console.warn(`⚠️ Performance warning: ${name} took ${metric.duration.toFixed(2)}ms`);
        
        // Send to analytics
        this.logSlowOperation(name, metric.duration);
      }
    }
  }
  
  logSlowOperation(name, duration) {
    // Send to your analytics service
    if (window.analytics) {
      window.analytics.track('slow_operation', {
        name,
        duration,
        url: window.location.pathname
      });
    }
  }
  
  measurePageLoad() {
    window.addEventListener('load', () => {
      const loadTime = performance.now() - this.startTime;
      console.log(`📊 Page loaded in ${loadTime.toFixed(2)}ms`);
      
      // Core Web Vitals
      if ('webVitals' in window) {
        window.webVitals.getCLS(console.log);
        window.webVitals.getFID(console.log);
        window.webVitals.getLCP(console.log);
      }
    });
  }
}

export const perfMonitor = new PerformanceMonitor();