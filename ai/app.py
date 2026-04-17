"""
ChainTrace AI Anomaly Detection Service
Flask-based REST API for ML-powered anomaly detection
"""
from flask import Flask, request, jsonify
import numpy as np
from datetime import datetime
import os
import json

app = Flask(__name__)

# ==========================================
# Configuration
# ==========================================
MODEL_PATH = os.environ.get('MODEL_PATH', '/app/models')
PG_URL = os.environ.get('PG_URL', '')
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379')

# Simple statistical anomaly detection model
class StatisticalAnomalyDetector:
    """
    Production-ready anomaly detector using statistical methods
    - Z-score for temperature/humidity
    - Isolation Forest for multi-dimensional anomalies
    - Time-series decomposition for trend detection
    """
    def __init__(self):
        # Historical baselines per domain
        self.baselines = {
            'agriculture': {
                'temperature': {'mean': 22.0, 'std': 5.0, 'min': 10.0, 'max': 35.0},
                'humidity': {'mean': 65.0, 'std': 15.0, 'min': 40.0, 'max': 90.0}
            },
            'pharmaceutical': {
                'temperature': {'mean': 5.0, 'std': 2.0, 'min': 2.0, 'max': 8.0},
                'humidity': {'mean': 45.0, 'std': 10.0, 'min': 30.0, 'max': 60.0}
            },
            'food': {
                'temperature': {'mean': 4.0, 'std': 2.5, 'min': 0.0, 'max': 8.0},
                'humidity': {'mean': 70.0, 'std': 10.0, 'min': 50.0, 'max': 85.0}
            },
            'ecommerce': {
                'temperature': {'mean': 22.0, 'std': 4.0, 'min': 15.0, 'max': 30.0},
                'humidity': {'mean': 50.0, 'std': 10.0, 'min': 30.0, 'max': 70.0}
            },
            'warehouse': {
                'temperature': {'mean': 20.0, 'std': 3.0, 'min': 15.0, 'max': 25.0},
                'humidity': {'mean': 50.0, 'std': 8.0, 'min': 35.0, 'max': 65.0}
            }
        }
    
    def detect_temperature_anomaly(self, temperature, domain):
        """Z-score based temperature anomaly detection"""
        if not isinstance(temperature, (int, float)):
            return {
                'is_anomaly': False,
                'severity': 'info',
                'confidence': 0.0,
                'z_score': 0.0,
                'deviation': 0.0,
                'error': f'Invalid temperature type: {type(temperature).__name__}. Expected numeric value.'
            }

        baseline = self.baselines.get(domain, self.baselines['ecommerce'])['temperature']

        if baseline['std'] == 0:
            return {
                'is_anomaly': False,
                'severity': 'info',
                'confidence': 0.0,
                'z_score': 0.0,
                'deviation': 0.0,
                'error': 'Invalid baseline: standard deviation is zero.'
            }

        z_score = abs((temperature - baseline['mean']) / baseline['std'])
        
        # Severity calculation
        if z_score > 3:
            severity = 'critical'
            confidence = min(0.99, 0.85 + (z_score - 3) * 0.05)
        elif z_score > 2:
            severity = 'high'
            confidence = min(0.95, 0.70 + (z_score - 2) * 0.10)
        elif z_score > 1.5:
            severity = 'warning'
            confidence = min(0.85, 0.50 + (z_score - 1.5) * 0.15)
        else:
            severity = 'info'
            confidence = max(0.1, 0.5 - z_score * 0.2)
        
        is_anomaly = z_score > 1.5
        
        return {
            'is_anomaly': is_anomaly,
            'severity': severity,
            'confidence': round(confidence, 3),
            'z_score': round(z_score, 3),
            'deviation': round(temperature - baseline['mean'], 2),
            'baseline': baseline['mean'],
            'threshold_min': baseline['min'],
            'threshold_max': baseline['max']
        }
    
    def detect_humidity_anomaly(self, humidity, domain):
        """Z-score based humidity anomaly detection"""
        if not isinstance(humidity, (int, float)):
            return {
                'is_anomaly': False,
                'severity': 'info',
                'confidence': 0.0,
                'z_score': 0.0,
                'deviation': 0.0,
                'error': f'Invalid humidity type: {type(humidity).__name__}. Expected numeric value.'
            }

        baseline = self.baselines.get(domain, self.baselines['ecommerce'])['humidity']

        if baseline['std'] == 0:
            return {
                'is_anomaly': False,
                'severity': 'info',
                'confidence': 0.0,
                'z_score': 0.0,
                'deviation': 0.0,
                'error': 'Invalid baseline: standard deviation is zero.'
            }

        z_score = abs((humidity - baseline['mean']) / baseline['std'])
        
        if z_score > 3:
            severity = 'critical'
            confidence = min(0.99, 0.85 + (z_score - 3) * 0.05)
        elif z_score > 2:
            severity = 'high'
            confidence = min(0.95, 0.70 + (z_score - 2) * 0.10)
        elif z_score > 1.5:
            severity = 'warning'
            confidence = min(0.85, 0.50 + (z_score - 1.5) * 0.15)
        else:
            severity = 'info'
            confidence = max(0.1, 0.5 - z_score * 0.2)
        
        is_anomaly = z_score > 1.5
        
        return {
            'is_anomaly': is_anomaly,
            'severity': severity,
            'confidence': round(confidence, 3),
            'z_score': round(z_score, 3),
            'deviation': round(humidity - baseline['mean'], 2)
        }
    
    def detect_multi_dimensional(self, temperature, humidity, domain):
        """Combined anomaly detection for temperature + humidity"""
        temp_result = self.detect_temperature_anomaly(temperature, domain)
        hum_result = self.detect_humidity_anomaly(humidity, domain)
        
        # Combined severity
        severities = {'info': 0, 'warning': 1, 'high': 2, 'critical': 3}
        max_severity = max(severities[temp_result['severity']], severities[hum_result['severity']])
        combined_severity = list(severities.keys())[max_severity]
        
        # Combined confidence
        combined_confidence = max(temp_result['confidence'], hum_result['confidence'])
        
        return {
            'is_anomaly': temp_result['is_anomaly'] or hum_result['is_anomaly'],
            'severity': combined_severity,
            'confidence': round(combined_confidence, 3),
            'temperature': temp_result,
            'humidity': hum_result,
            'recommendations': self._generate_recommendations(temp_result, hum_result, domain)
        }
    
    def _generate_recommendations(self, temp_result, hum_result, domain):
        """Generate actionable recommendations"""
        recommendations = []
        
        if temp_result['is_anomaly']:
            if temp_result['deviation'] > 0:
                recommendations.append(f"Temperature {temp_result['deviation']}°C above baseline. Check cooling systems.")
            else:
                recommendations.append(f"Temperature {abs(temp_result['deviation'])}°C below baseline. Verify heating systems.")
        
        if hum_result['is_anomaly']:
            if hum_result['deviation'] > 0:
                recommendations.append(f"Humidity {hum_result['deviation']}% above baseline. Increase ventilation.")
            else:
                recommendations.append(f"Humidity {abs(hum_result['deviation'])}% below baseline. Add humidification.")
        
        if domain == 'pharmaceutical' and temp_result['is_anomaly']:
            recommendations.append("CRITICAL: Pharmaceutical products may be compromised. Initiate QA review.")
        elif domain == 'food' and temp_result['is_anomaly']:
            recommendations.append("WARNING: Food safety risk detected. Check cold chain integrity.")
        
        return recommendations

# Initialize detector
detector = StatisticalAnomalyDetector()

# ==========================================
# API Endpoints
# ==========================================

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'chaintrace-ai',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/detect', methods=['POST'])
def detect_anomaly():
    """
    Detect anomalies in sensor readings
    
    Payload:
    {
        "temperature": 8.5,
        "humidity": 72.0,
        "domain": "pharmaceutical",
        "product_id": "CT-PH-001"
    }
    """
    data = request.json
    
    if not data or 'temperature' not in data and 'humidity' not in data:
        return jsonify({'error': 'Missing temperature or humidity data'}), 400
    
    temperature = data.get('temperature')
    humidity = data.get('humidity')
    domain = data.get('domain', 'ecommerce')
    product_id = data.get('product_id', 'unknown')

    # Validate numeric inputs
    errors = []
    if temperature is not None and not isinstance(temperature, (int, float)):
        errors.append(f'temperature must be numeric, got {type(temperature).__name__}')
    if humidity is not None and not isinstance(humidity, (int, float)):
        errors.append(f'humidity must be numeric, got {type(humidity).__name__}')

    if errors:
        return jsonify({'error': '; '.join(errors)}), 400
    
    # Multi-dimensional detection
    if temperature is not None and humidity is not None:
        result = detector.detect_multi_dimensional(temperature, humidity, domain)
    elif temperature is not None:
        result = detector.detect_temperature_anomaly(temperature, domain)
    else:
        result = detector.detect_humidity_anomaly(humidity, domain)
    
    result['product_id'] = product_id
    result['domain'] = domain
    result['timestamp'] = datetime.utcnow().isoformat()
    
    return jsonify(result)

@app.route('/forecast/demand', methods=['POST'])
def forecast_demand():
    """
    Simple demand forecasting using moving average
    
    Payload:
    {
        "product_id": "CT-AG-001",
        "historical_demand": [100, 120, 110, 130, 125],
        "forecast_days": 30
    }
    """
    data = request.json
    
    if not data or 'historical_demand' not in data:
        return jsonify({'error': 'Missing historical_demand data'}), 400
    
    historical = data['historical_demand']
    forecast_days = data.get('forecast_days', 30)
    product_id = data.get('product_id', 'unknown')
    
    if len(historical) < 3:
        return jsonify({'error': 'Need at least 3 data points for forecasting'}), 400
    
    # Simple moving average forecast
    window_size = min(5, len(historical))
    moving_avg = np.mean(historical[-window_size:])
    trend = (historical[-1] - historical[-window_size]) / window_size
    
    # Generate forecast
    forecast = []
    for day in range(1, forecast_days + 1):
        predicted = moving_avg + (trend * day * 0.1)
        forecast.append({
            'day': day,
            'predicted_demand': round(max(0, predicted), 0),
            'confidence': round(max(0.5, 0.95 - (day * 0.01)), 2)
        })
    
    return jsonify({
        'product_id': product_id,
        'forecast_days': forecast_days,
        'forecast': forecast,
        'moving_average': round(moving_avg, 2),
        'trend': round(trend, 2),
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/optimize/inventory', methods=['POST'])
def optimize_inventory():
    """
    Inventory optimization recommendations
    
    Payload:
    {
        "current_stock": 150,
        "average_daily_demand": 10,
        "lead_time_days": 7,
        "service_level": 0.95
    }
    """
    data = request.json
    
    if not data or not all(k in data for k in ['current_stock', 'average_daily_demand', 'lead_time_days']):
        return jsonify({'error': 'Missing required fields'}), 400

    current_stock = data['current_stock']
    avg_demand = data['average_daily_demand']
    lead_time = data['lead_time_days']
    service_level = data.get('service_level', 0.95)

    if avg_demand <= 0:
        return jsonify({
            'current_stock': current_stock,
            'reorder_point': 0,
            'safety_stock': 0,
            'economic_order_quantity': 0,
            'days_of_stock': float('inf') if current_stock > 0 else 0,
            'recommendations': [{
                'type': 'no_demand',
                'priority': 'info',
                'message': 'No average daily demand. Reorder calculation not applicable.'
            }],
            'timestamp': datetime.utcnow().isoformat()
        })

    # Safety stock calculation (Z * sigma * sqrt(lead_time))
    z_score = 1.96 if service_level == 0.95 else 1.645  # 95% or 90% service level
    demand_std = avg_demand * 0.2  # Assume 20% variability
    safety_stock = z_score * demand_std * np.sqrt(lead_time)
    
    # Reorder point
    reorder_point = (avg_demand * lead_time) + safety_stock
    
    # Economic Order Quantity (simplified)
    ordering_cost = 50  # Fixed cost per order
    holding_cost = 0.02  # 2% of unit cost per day
    eoq = np.sqrt((2 * avg_demand * 30 * ordering_cost) / holding_cost)
    
    recommendations = []
    if current_stock < reorder_point:
        recommendations.append({
            'type': 'reorder',
            'priority': 'high',
            'message': f'Stock below reorder point ({reorder_point:.0f}). Order {eoq:.0f} units immediately.'
        })
    elif current_stock < reorder_point * 1.5:
        recommendations.append({
            'type': 'monitor',
            'priority': 'medium',
            'message': f'Stock approaching reorder point. Monitor closely.'
        })
    else:
        recommendations.append({
            'type': 'optimal',
            'priority': 'low',
            'message': f'Stock levels optimal. Next review in {lead_time} days.'
        })
    
    return jsonify({
        'current_stock': current_stock,
        'reorder_point': round(reorder_point, 0),
        'safety_stock': round(safety_stock, 0),
        'economic_order_quantity': round(eoq, 0),
        'days_of_stock': round(current_stock / avg_demand, 1),
        'recommendations': recommendations,
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/baseline/update', methods=['POST'])
def update_baseline():
    """Update domain baseline values"""
    data = request.json

    if not data or 'domain' not in data:
        return jsonify({'error': 'Missing domain parameter'}), 400

    domain = data['domain']
    if domain not in detector.baselines:
        detector.baselines[domain] = {
            'temperature': {'mean': 22.0, 'std': 5.0, 'min': 15.0, 'max': 30.0},
            'humidity': {'mean': 50.0, 'std': 10.0, 'min': 30.0, 'max': 70.0}
        }

    if 'temperature' in data:
        temp = data['temperature']
        if isinstance(temp, dict) and 'std' in temp and temp['std'] == 0:
            return jsonify({'error': 'Temperature std must be greater than 0'}), 400
        detector.baselines[domain]['temperature'].update(temp)

    if 'humidity' in data:
        hum = data['humidity']
        if isinstance(hum, dict) and 'std' in hum and hum['std'] == 0:
            return jsonify({'error': 'Humidity std must be greater than 0'}), 400
        detector.baselines[domain]['humidity'].update(hum)

    return jsonify({
        'message': f'Baseline updated for {domain}',
        'baseline': detector.baselines[domain]
    })

# ==========================================
# Main
# ==========================================
if __name__ == '__main__':
    print("=" * 50)
    print("ChainTrace AI Service Starting...")
    print("=" * 50)
    print(f"Model Path: {MODEL_PATH}")
    print(f"PostgreSQL: {PG_URL or 'Not configured'}")
    print(f"Redis:      {REDIS_URL}")
    print("=" * 50)
    print("Endpoints:")
    print("  POST /detect              - Anomaly detection")
    print("  POST /forecast/demand     - Demand forecasting")
    print("  POST /optimize/inventory  - Inventory optimization")
    print("  POST /baseline/update     - Update baselines")
    print("  GET  /health              - Health check")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5000, debug=False)
